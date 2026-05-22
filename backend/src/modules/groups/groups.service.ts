import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { StudentGroup } from './entities/student-group.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupTask } from './entities/group-task.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { User } from '../users/entities/user.entity';
import { TaskSubmission } from '../tasks/entities/task-submission.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(StudentGroup)
    private groupsRepository: Repository<StudentGroup>,
    @InjectRepository(GroupMember)
    private membersRepository: Repository<GroupMember>,
    @InjectRepository(GroupTask)
    private groupTasksRepository: Repository<GroupTask>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(TaskSubmission)
    private submissionsRepository: Repository<TaskSubmission>,
  ) {}

  async createGroup(teacherId: string, createGroupDto: CreateGroupDto): Promise<StudentGroup> {
    const group = this.groupsRepository.create({
      ...createGroupDto,
      teacherId,
    });

    const savedGroup = await this.groupsRepository.save(group);

    // Add students if provided
    if (createGroupDto.studentIds && createGroupDto.studentIds.length > 0) {
      await this.addStudentsToGroup(savedGroup.id, createGroupDto.studentIds, teacherId);
    }

    return savedGroup;
  }

  async getTeacherGroups(teacherId: string): Promise<StudentGroup[]> {
    return this.groupsRepository.find({
      where: { teacherId },
      order: { createdAt: 'DESC' },
    });
  }

  async getGroupById(groupId: string, userId: string): Promise<any> {
    const group = await this.groupsRepository.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.teacherId !== userId) {
      throw new ForbiddenException('You can only view your own groups');
    }

    // Get members with their profiles
    const members = await this.membersRepository
      .createQueryBuilder('gm')
      .leftJoinAndSelect('gm.student', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('gm.group_id = :groupId', { groupId })
      .getMany();

    // Get assigned tasks
    const tasks = await this.groupTasksRepository
      .createQueryBuilder('gt')
      .leftJoinAndSelect('gt.task', 'task')
      .where('gt.group_id = :groupId', { groupId })
      .getMany();

    return {
      ...group,
      members: members.map(m => ({
        id: m.student.id,
        email: m.student.email,
        fullName: m.student.profile?.fullName || m.student.email,
        joinedAt: m.joinedAt,
      })),
      tasks: tasks.map(t => ({
        ...t.task,
        assignedAt: t.assignedAt,
        dueDate: t.dueDate,
      })),
    };
  }

  async updateGroup(groupId: string, teacherId: string, updateData: Partial<CreateGroupDto>): Promise<StudentGroup> {
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.teacherId !== teacherId) {
      throw new ForbiddenException('You can only update your own groups');
    }

    Object.assign(group, updateData);
    return this.groupsRepository.save(group);
  }

  async deleteGroup(groupId: string, teacherId: string): Promise<void> {
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.teacherId !== teacherId) {
      throw new ForbiddenException('You can only delete your own groups');
    }

    await this.groupsRepository.remove(group);
  }

  async addStudentsToGroup(groupId: string, studentIds: string[], teacherId: string): Promise<void> {
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.teacherId !== teacherId) {
      throw new ForbiddenException('You can only modify your own groups');
    }

    const members = studentIds.map(studentId =>
      this.membersRepository.create({ groupId, studentId }),
    );

    await this.membersRepository.save(members);
  }

  async removeStudentFromGroup(groupId: string, studentId: string, teacherId: string): Promise<void> {
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.teacherId !== teacherId) {
      throw new ForbiddenException('You can only modify your own groups');
    }

    await this.membersRepository.delete({ groupId, studentId });
  }

  async assignTaskToGroup(groupId: string, assignTaskDto: AssignTaskDto, teacherId: string): Promise<void> {
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.teacherId !== teacherId) {
      throw new ForbiddenException('You can only modify your own groups');
    }

    const groupTask = this.groupTasksRepository.create({
      groupId,
      taskId: assignTaskDto.taskId,
      dueDate: assignTaskDto.dueDate ? new Date(assignTaskDto.dueDate) : null,
    });

    await this.groupTasksRepository.save(groupTask);
  }

  async getGroupStats(groupId: string, teacherId: string): Promise<any> {
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.teacherId !== teacherId) {
      throw new ForbiddenException('You can only view your own groups');
    }

    // Get all student IDs in the group
    const members = await this.membersRepository.find({
      where: { groupId },
      select: ['studentId'],
    });

    const studentIds = members.map(m => m.studentId);

    if (studentIds.length === 0) {
      return {
        totalStudents: 0,
        avgGrade: 0,
        completionRate: 0,
        activeStudents: 0,
      };
    }

    // Get all tasks assigned to this group
    const groupTasks = await this.groupTasksRepository.find({
      where: { groupId },
      select: ['taskId'],
    });

    const taskIds = groupTasks.map(gt => gt.taskId);

    if (taskIds.length === 0) {
      return {
        totalStudents: studentIds.length,
        avgGrade: 0,
        completionRate: 0,
        activeStudents: 0,
      };
    }

    // Calculate average grade
    const avgGradeResult = await this.submissionsRepository
      .createQueryBuilder('sub')
      .select('AVG(sub.grade)', 'avg')
      .where('sub.user_id IN (:...studentIds)', { studentIds })
      .andWhere('sub.task_id IN (:...taskIds)', { taskIds })
      .andWhere('sub.status = :status', { status: 'reviewed' })
      .andWhere('sub.grade IS NOT NULL')
      .getRawOne();

    const avgGrade = parseFloat(avgGradeResult?.avg || '0');

    // Calculate completion rate
    const totalExpected = studentIds.length * taskIds.length;
    const completedCount = await this.submissionsRepository.count({
      where: {
        userId: In(studentIds),
        taskId: In(taskIds),
        status: 'reviewed',
      },
    });

    const completionRate = totalExpected > 0 ? (completedCount / totalExpected) * 100 : 0;

    // Count active students (submitted at least one task in last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const activeStudentsResult = await this.submissionsRepository
      .createQueryBuilder('sub')
      .select('COUNT(DISTINCT sub.user_id)', 'count')
      .where('sub.user_id IN (:...studentIds)', { studentIds })
      .andWhere('sub.task_id IN (:...taskIds)', { taskIds })
      .andWhere('sub.submitted_at >= :weekAgo', { weekAgo })
      .getRawOne();

    const activeStudents = parseInt(activeStudentsResult?.count || '0', 10);

    return {
      totalStudents: studentIds.length,
      avgGrade: Math.round(avgGrade * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      activeStudents,
    };
  }
}

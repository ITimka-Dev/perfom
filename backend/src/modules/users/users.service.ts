import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { TeacherSubject } from './entities/teacher-subject.entity';
import { SignUpDto } from '../auth/dto/signup.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateTeacherSubjectsDto } from './dto/update-teacher-subjects.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
    @InjectRepository(TeacherSubject)
    private teacherSubjectsRepository: Repository<TeacherSubject>,
  ) {}

  async create(signUpDto: SignUpDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: signUpDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(signUpDto.password, 10);

    const user = this.usersRepository.create({
      email: signUpDto.email,
      password: hashedPassword,
      role: 'student',
    });

    const savedUser = await this.usersRepository.save(user);

    const profile = this.profilesRepository.create({
      id: savedUser.id,
      fullName: signUpDto.fullName,
    });

    await this.profilesRepository.save(profile);

    return savedUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['profile'],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['profile'],
    });
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    let profile = await this.profilesRepository.findOne({
      where: { id: userId },
    });

    if (!profile) {
      profile = this.profilesRepository.create({
        id: userId,
        ...updateProfileDto,
      });
    } else {
      Object.assign(profile, updateProfileDto);
    }

    return this.profilesRepository.save(profile);
  }

  async getProfile(userId: string): Promise<Profile> {
    const profile = await this.profilesRepository.findOne({
      where: { id: userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async getTeacherSubjects(userId: string): Promise<string[]> {
    const subjects = await this.teacherSubjectsRepository.find({
      where: { userId },
      relations: ['zone'],
    });

    return subjects.map(subject => subject.zoneId);
  }

  async updateTeacherSubjects(
    userId: string,
    updateTeacherSubjectsDto: UpdateTeacherSubjectsDto,
  ): Promise<string[]> {
    // Remove all existing subjects for this teacher
    await this.teacherSubjectsRepository.delete({ userId });

    // Add new subjects
    const newSubjects = updateTeacherSubjectsDto.zoneIds.map(zoneId =>
      this.teacherSubjectsRepository.create({ userId, zoneId }),
    );

    await this.teacherSubjectsRepository.save(newSubjects);

    return updateTeacherSubjectsDto.zoneIds;
  }

  async getTeacherStats(userId: string) {
    const teacherSubjects = await this.teacherSubjectsRepository.find({
      where: { userId },
      select: ['zoneId'],
    });

    const zoneIds = teacherSubjects.map((ts) => ts.zoneId);

    if (zoneIds.length === 0) {
      return {
        totalStudents: 0,
        pendingReviews: 0,
        reviewedToday: 0,
        avgGrade: 0,
      };
    }

    // Get total unique students who have progress in teacher's zones
    const studentsQuery = this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user_zone_progress', 'progress', 'progress.user_id = user.id')
      .where('progress.zone_id IN (:...zoneIds)', { zoneIds })
      .andWhere('user.role = :role', { role: 'student' })
      .select('COUNT(DISTINCT user.id)', 'count');

    const studentsResult = await studentsQuery.getRawOne();
    const totalStudents = parseInt(studentsResult?.count || '0', 10);

    // Get pending reviews count
    const pendingReviewsQuery = this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('task_submissions', 'submission', 'submission.user_id = user.id')
      .innerJoin('tasks', 'task', 'task.id = submission.task_id')
      .where('task.zone_id IN (:...zoneIds)', { zoneIds })
      .andWhere('submission.status = :status', { status: 'pending' })
      .select('COUNT(submission.id)', 'count');

    const pendingResult = await pendingReviewsQuery.getRawOne();
    const pendingReviews = parseInt(pendingResult?.count || '0', 10);

    // Get reviewed today count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reviewedTodayQuery = this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('task_submissions', 'submission', 'submission.user_id = user.id')
      .innerJoin('tasks', 'task', 'task.id = submission.task_id')
      .where('task.zone_id IN (:...zoneIds)', { zoneIds })
      .andWhere('submission.status = :status', { status: 'reviewed' })
      .andWhere('submission.reviewed_by = :userId', { userId })
      .andWhere('submission.reviewed_at >= :today', { today })
      .select('COUNT(submission.id)', 'count');

    const reviewedTodayResult = await reviewedTodayQuery.getRawOne();
    const reviewedToday = parseInt(reviewedTodayResult?.count || '0', 10);

    // Get average grade
    const avgGradeQuery = this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('task_submissions', 'submission', 'submission.user_id = user.id')
      .innerJoin('tasks', 'task', 'task.id = submission.task_id')
      .where('task.zone_id IN (:...zoneIds)', { zoneIds })
      .andWhere('submission.status = :status', { status: 'reviewed' })
      .andWhere('submission.grade IS NOT NULL')
      .select('AVG(submission.grade)', 'avg');

    const avgGradeResult = await avgGradeQuery.getRawOne();
    const avgGrade = parseFloat(avgGradeResult?.avg || '0');

    return {
      totalStudents,
      pendingReviews,
      reviewedToday,
      avgGrade: Math.round(avgGrade * 10) / 10,
    };
  }

  async getStudentsList(
    userId: string,
    filters?: {
      zoneId?: string;
      minLevel?: number;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const teacherSubjects = await this.teacherSubjectsRepository.find({
      where: { userId },
      select: ['zoneId'],
    });

    const zoneIds = teacherSubjects.map((ts) => ts.zoneId);

    if (zoneIds.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    let query = this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user_zone_progress', 'progress', 'progress.user_id = user.id')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('progress.zone_id IN (:...zoneIds)', { zoneIds })
      .andWhere('user.role = :role', { role: 'student' });

    if (filters?.zoneId) {
      query = query.andWhere('progress.zone_id = :zoneId', {
        zoneId: filters.zoneId,
      });
    }

    if (filters?.minLevel) {
      query = query.andWhere('progress.level >= :minLevel', {
        minLevel: filters.minLevel,
      });
    }

    if (filters?.search) {
      query = query.andWhere(
        '(user.email ILIKE :search OR profile.full_name ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const [users, total] = await query
      .select([
        'user.id',
        'user.email',
        'user.createdAt',
        'profile.fullName',
        'progress.level',
        'progress.tasksCompleted',
        'progress.updatedAt',
      ])
      .distinct(true)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Get stats for each student
    const studentsWithStats = await Promise.all(
      users.map(async (user) => {
        // Get average grade
        const avgGradeQuery = this.usersRepository
          .createQueryBuilder('u')
          .innerJoin('task_submissions', 'submission', 'submission.user_id = u.id')
          .innerJoin('tasks', 'task', 'task.id = submission.task_id')
          .where('u.id = :userId', { userId: user.id })
          .andWhere('task.zone_id IN (:...zoneIds)', { zoneIds })
          .andWhere('submission.status = :status', { status: 'reviewed' })
          .andWhere('submission.grade IS NOT NULL')
          .select('AVG(submission.grade)', 'avg');

        const avgGradeResult = await avgGradeQuery.getRawOne();
        const avgGrade = parseFloat(avgGradeResult?.avg || '0');

        // Get max level across all zones
        const maxLevelQuery = this.usersRepository
          .createQueryBuilder('u')
          .innerJoin('user_zone_progress', 'p', 'p.user_id = u.id')
          .where('u.id = :userId', { userId: user.id })
          .andWhere('p.zone_id IN (:...zoneIds)', { zoneIds })
          .select('MAX(p.level)', 'max');

        const maxLevelResult = await maxLevelQuery.getRawOne();
        const level = parseInt(maxLevelResult?.max || '1', 10);

        // Get total tasks completed
        const tasksQuery = this.usersRepository
          .createQueryBuilder('u')
          .innerJoin('user_zone_progress', 'p', 'p.user_id = u.id')
          .where('u.id = :userId', { userId: user.id })
          .andWhere('p.zone_id IN (:...zoneIds)', { zoneIds })
          .select('SUM(p.tasks_completed)', 'sum');

        const tasksResult = await tasksQuery.getRawOne();
        const tasksCompleted = parseInt(tasksResult?.sum || '0', 10);

        return {
          id: user.id,
          name: user.profile?.fullName || user.email,
          email: user.email,
          level,
          tasksCompleted,
          avgGrade: Math.round(avgGrade * 10) / 10,
          lastActive: user.updatedAt?.toISOString() || user.createdAt.toISOString(),
        };
      }),
    );

    return {
      data: studentsWithStats,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSubmissionsByTeacher(
    userId: string,
    filters?: {
      zoneId?: string;
      status?: 'pending' | 'reviewed' | 'rejected';
      startDate?: Date;
      endDate?: Date;
      studentId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const teacherSubjects = await this.teacherSubjectsRepository.find({
      where: { userId },
      select: ['zoneId'],
    });

    const zoneIds = teacherSubjects.map((ts) => ts.zoneId);

    if (zoneIds.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    let query = this.usersRepository
      .createQueryBuilder('submission')
      .from('task_submissions', 'submission')
      .innerJoin('tasks', 'task', 'task.id = submission.task_id')
      .innerJoin('users', 'user', 'user.id = submission.user_id')
      .leftJoin('profiles', 'profile', 'profile.id = user.id')
      .where('task.zone_id IN (:...zoneIds)', { zoneIds });

    if (filters?.zoneId) {
      query = query.andWhere('task.zone_id = :zoneId', {
        zoneId: filters.zoneId,
      });
    }

    if (filters?.status) {
      query = query.andWhere('submission.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.startDate) {
      query = query.andWhere('submission.submitted_at >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      query = query.andWhere('submission.submitted_at <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters?.studentId) {
      query = query.andWhere('user.id = :studentId', {
        studentId: filters.studentId,
      });
    }

    // Get total count
    const countQuery = query.clone();
    const totalResult = await countQuery
      .select('COUNT(submission.id)', 'count')
      .getRawOne();
    const total = parseInt(totalResult?.count || '0', 10);

    // Get paginated results
    const submissions = await query
      .select([
        'submission.id as id',
        'submission.status as status',
        'submission.grade as grade',
        'submission.submitted_at as submittedAt',
        'submission.reviewed_at as reviewedAt',
        'task.id as taskId',
        'task.title as taskTitle',
        'user.id as studentId',
        'user.email as studentEmail',
        'profile.full_name as studentName',
      ])
      .orderBy('submission.submitted_at', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    const submissionsData = submissions.map((s) => ({
      id: s.id,
      studentId: s.studentid,
      studentName: s.studentname || s.studentemail,
      taskId: s.taskid,
      taskTitle: s.tasktitle,
      submittedAt: s.submittedat,
      status: s.status,
      grade: s.grade || null,
    }));

    return {
      data: submissionsData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

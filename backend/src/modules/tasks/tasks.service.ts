import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { TaskSubmission } from './entities/task-submission.entity';
import { SubmissionComment } from './entities/submission-comment.entity';
import { CommentTemplate } from './entities/comment-template.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { ProgressService } from '../progress/progress.service';
import { AchievementsService } from '../achievements/achievements.service';
import { TasksGateway } from './tasks.gateway';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(TaskSubmission)
    private submissionsRepository: Repository<TaskSubmission>,
    @InjectRepository(SubmissionComment)
    private commentsRepository: Repository<SubmissionComment>,
    @InjectRepository(CommentTemplate)
    private templatesRepository: Repository<CommentTemplate>,
    @Inject(forwardRef(() => ProgressService))
    private progressService: ProgressService,
    @Inject(forwardRef(() => AchievementsService))
    private achievementsService: AchievementsService,
    @Inject(forwardRef(() => TasksGateway))
    private tasksGateway: TasksGateway,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      createdBy: userId,
    });
    return this.tasksRepository.save(task);
  }

  async findAll(): Promise<Task[]> {
    return this.tasksRepository.find({
      relations: ['zone'],
      order: { createdAt: 'DESC' },
      cache: 60000, // Cache for 1 minute
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['zone'],
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string, userRole: string): Promise<Task> {
    const task = await this.findOne(id);
    
    if (task.createdBy !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You can only update your own tasks');
    }

    Object.assign(task, updateTaskDto);
    return this.tasksRepository.save(task);
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const task = await this.findOne(id);
    
    if (task.createdBy !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You can only delete your own tasks');
    }

    await this.tasksRepository.remove(task);
  }

  async submitTask(taskId: string, userId: string, createSubmissionDto: CreateSubmissionDto): Promise<TaskSubmission> {
    const task = await this.findOne(taskId);
    
    const submission = this.submissionsRepository.create({
      taskId,
      userId,
      submissionText: createSubmissionDto.content,
      fileUrls: createSubmissionDto.attachmentUrls || [],
      status: 'pending',
    });

    return this.submissionsRepository.save(submission);
  }

  async getSubmissions(taskId: string): Promise<TaskSubmission[]> {
    return this.submissionsRepository.find({
      where: { taskId },
      relations: ['task'],
      order: { submittedAt: 'DESC' },
    });
  }

  async getUserSubmissions(userId: string): Promise<TaskSubmission[]> {
    return this.submissionsRepository.find({
      where: { userId },
      relations: ['task'],
      order: { submittedAt: 'DESC' },
    });
  }

  async gradeSubmission(submissionId: string, gradeSubmissionDto: GradeSubmissionDto, reviewerId: string): Promise<TaskSubmission> {
    const queryRunner = this.submissionsRepository.manager.connection.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const submission = await queryRunner.manager.findOne(TaskSubmission, {
        where: { id: submissionId },
        relations: ['task', 'task.zone'],
      });

      if (!submission) {
        throw new NotFoundException('Submission not found');
      }

      submission.grade = gradeSubmissionDto.grade;
      submission.teacherFeedback = gradeSubmissionDto.feedback;
      submission.status = gradeSubmissionDto.status || 'reviewed';
      submission.reviewedBy = reviewerId;
      submission.reviewedAt = new Date();

      const savedSubmission = await queryRunner.manager.save(submission);

      // Award XP if grade is passing and status is reviewed
      if (submission.status === 'reviewed' && submission.grade && submission.grade >= 60) {
        const xpReward = submission.task.experienceReward || 100;
        
        // Add XP to zone progress
        await this.progressService.addExperience(
          submission.userId,
          submission.task.zoneId,
          xpReward,
        );

        // Increment tasks completed
        await this.progressService.incrementTasksCompleted(
          submission.userId,
          submission.task.zoneId,
        );

        // Check for achievements
        // 1. Perfect grades (90+)
        if (submission.grade >= 90) {
          await this.achievementsService.checkAndUnlockAchievements(
            submission.userId,
            'perfect_grade',
            1,
          );
        }

        // 2. Count total completed tasks for activity achievements
        const completedCount = await queryRunner.manager.count(TaskSubmission, {
          where: { 
            userId: submission.userId,
            status: 'reviewed',
          },
        });
        
        await this.achievementsService.checkAndUnlockAchievements(
          submission.userId,
          'tasks_completed',
          completedCount,
        );

        // 3. High average grade achievement
        const avgGradeResult = await queryRunner.manager
          .createQueryBuilder(TaskSubmission, 'sub')
          .select('AVG(sub.grade)', 'avg')
          .where('sub.userId = :userId', { userId: submission.userId })
          .andWhere('sub.status = :status', { status: 'reviewed' })
          .andWhere('sub.grade IS NOT NULL')
          .getRawOne();
        
        const avgGrade = parseFloat(avgGradeResult?.avg || '0');
        if (avgGrade >= 85) {
          await this.achievementsService.checkAndUnlockAchievements(
            submission.userId,
            'high_average',
            Math.floor(avgGrade),
          );
        }
      }

      await queryRunner.commitTransaction();

      return savedSubmission;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getSubmissionById(submissionId: string): Promise<TaskSubmission> {
    const submission = await this.submissionsRepository.findOne({
      where: { id: submissionId },
      relations: ['task', 'task.zone', 'user', 'user.profile'],
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return submission;
  }

  // Submission Comments
  async createComment(submissionId: string, teacherId: string, createCommentDto: CreateCommentDto): Promise<SubmissionComment> {
    // Get submission to find student ID
    const submission = await this.submissionsRepository.findOne({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    const comment = this.commentsRepository.create({
      submissionId,
      teacherId,
      commentText: createCommentDto.commentText,
      fileUrls: createCommentDto.fileUrls || [],
    });
    
    const savedComment = await this.commentsRepository.save(comment);

    // Send real-time notification to student
    try {
      this.tasksGateway.emitCommentNotification(submission.userId, {
        submissionId,
        comment: savedComment,
        taskTitle: submission.task?.title || 'Task',
      });
    } catch (error) {
      console.error('Error sending comment notification:', error);
    }

    return savedComment;
  }

  async getCommentsBySubmission(submissionId: string): Promise<SubmissionComment[]> {
    return this.commentsRepository.find({
      where: { submissionId },
      order: { createdAt: 'ASC' },
    });
  }

  async updateComment(commentId: string, teacherId: string, commentText: string): Promise<SubmissionComment> {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.teacherId !== teacherId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    comment.commentText = commentText;
    return this.commentsRepository.save(comment);
  }

  async deleteComment(commentId: string, teacherId: string): Promise<void> {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.teacherId !== teacherId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentsRepository.remove(comment);
  }

  // Comment Templates
  async createTemplate(teacherId: string, createTemplateDto: CreateTemplateDto): Promise<CommentTemplate> {
    const template = this.templatesRepository.create({
      teacherId,
      ...createTemplateDto,
    });
    return this.templatesRepository.save(template);
  }

  async getTemplatesByTeacher(teacherId: string): Promise<CommentTemplate[]> {
    return this.templatesRepository.find({
      where: { teacherId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateTemplate(templateId: string, teacherId: string, updateTemplateDto: UpdateTemplateDto): Promise<CommentTemplate> {
    const template = await this.templatesRepository.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.teacherId !== teacherId) {
      throw new ForbiddenException('You can only update your own templates');
    }

    Object.assign(template, updateTemplateDto);
    return this.templatesRepository.save(template);
  }

  async deleteTemplate(templateId: string, teacherId: string): Promise<void> {
    const template = await this.templatesRepository.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.teacherId !== teacherId) {
      throw new ForbiddenException('You can only delete your own templates');
    }

    await this.templatesRepository.remove(template);
  }

  async getComparativeAnalytics(query: any) {
    const { zoneIds, startDate1, endDate1, startDate2, endDate2 } = query;
    
    const zones = zoneIds ? (Array.isArray(zoneIds) ? zoneIds : [zoneIds]) : [];
    
    // Get data for first period
    const period1Data = await this.getAnalyticsForPeriod(zones, startDate1, endDate1);
    
    // Get data for second period
    const period2Data = await this.getAnalyticsForPeriod(zones, startDate2, endDate2);
    
    return {
      period1: {
        label: startDate1 && endDate1 ? `${startDate1} - ${endDate1}` : 'Период 1',
        data: period1Data,
      },
      period2: {
        label: startDate2 && endDate2 ? `${startDate2} - ${endDate2}` : 'Период 2',
        data: period2Data,
      },
    };
  }

  private async getAnalyticsForPeriod(zoneIds: string[], startDate?: string, endDate?: string) {
    const queryBuilder = this.submissionsRepository
      .createQueryBuilder('submission')
      .leftJoin('submission.task', 'task')
      .select('task.zone_id', 'zoneId')
      .addSelect('COUNT(submission.id)', 'totalSubmissions')
      .addSelect('AVG(submission.grade)', 'avgGrade')
      .addSelect(
        'COUNT(CASE WHEN submission.status = \'reviewed\' THEN 1 END)',
        'reviewedCount',
      )
      .addSelect(
        'COUNT(CASE WHEN submission.status = \'pending\' THEN 1 END)',
        'pendingCount',
      )
      .groupBy('task.zone_id');

    if (zoneIds.length > 0) {
      queryBuilder.where('task.zone_id IN (:...zoneIds)', { zoneIds });
    }

    if (startDate) {
      queryBuilder.andWhere('submission.submitted_at >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('submission.submitted_at <= :endDate', { endDate });
    }

    return queryBuilder.getRawMany();
  }
}

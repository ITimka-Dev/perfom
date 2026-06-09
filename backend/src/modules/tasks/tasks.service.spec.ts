import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { TaskSubmission } from './entities/task-submission.entity';
import { SubmissionComment } from './entities/submission-comment.entity';
import { CommentTemplate } from './entities/comment-template.entity';
import { ProgressService } from '../progress/progress.service';
import { AchievementsService } from '../achievements/achievements.service';
import { TasksGateway } from './tasks.gateway';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';

describe('TasksService', () => {
  let service: TasksService;
  let tasksRepository: Repository<Task>;
  let submissionsRepository: Repository<TaskSubmission>;
  let progressService: ProgressService;
  let achievementsService: AchievementsService;

  const mockTask: Partial<Task> = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    difficulty: 3,
    experienceReward: 100,
    zoneId: 'zone-1',
    createdBy: 'teacher-1',
  };

  const mockSubmission: Partial<TaskSubmission> = {
    id: 'submission-1',
    taskId: 'task-1',
    userId: 'user-1',
    submissionText: 'test answer',
    status: 'pending',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TaskSubmission),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            manager: {
              connection: {
                createQueryRunner: jest.fn(),
              },
            },
          },
        },
        {
          provide: getRepositoryToken(SubmissionComment),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CommentTemplate),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: ProgressService,
          useValue: {
            addExperience: jest.fn(),
            incrementTasksCompleted: jest.fn(),
          },
        },
        {
          provide: AchievementsService,
          useValue: {
            checkAndUnlockAchievements: jest.fn(),
          },
        },
        {
          provide: TasksGateway,
          useValue: {
            emitCommentNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    tasksRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    submissionsRepository = module.get<Repository<TaskSubmission>>(getRepositoryToken(TaskSubmission));
    progressService = module.get<ProgressService>(ProgressService);
    achievementsService = module.get<AchievementsService>(AchievementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        difficulty: 3,
        experienceReward: 100,
        zoneId: 'zone-1',
      };

      jest.spyOn(tasksRepository, 'create').mockReturnValue(mockTask as Task);
      jest.spyOn(tasksRepository, 'save').mockResolvedValue(mockTask as Task);

      const result = await service.create(createTaskDto, 'teacher-1');

      expect(result).toEqual(mockTask);
    });
  });

  describe('findOne', () => {
    it('should return a task', async () => {
      jest.spyOn(tasksRepository, 'findOne').mockResolvedValue(mockTask as Task);

      const result = await service.findOne('task-1');

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      jest.spyOn(tasksRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('task-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('submitTask', () => {
    it('should reject attachments with extensions not allowed by the teacher', async () => {
      jest.spyOn(tasksRepository, 'findOne').mockResolvedValue({
        ...mockTask,
        allowedSubmissionFileTypes: ['pdf', 'png'],
      } as Task);

      await expect(
        service.submitTask('task-1', 'student-1', {
          content: 'My answer',
          attachmentUrls: ['https://example.com/homework.exe'],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(submissionsRepository.save).not.toHaveBeenCalled();
    });

    it('should accept attachments with allowed extensions', async () => {
      const savedSubmission = {
        ...mockSubmission,
        fileUrls: ['https://example.com/homework.PDF?download=1'],
      } as TaskSubmission;

      jest.spyOn(tasksRepository, 'findOne').mockResolvedValue({
        ...mockTask,
        allowedSubmissionFileTypes: ['pdf'],
      } as Task);
      jest.spyOn(submissionsRepository, 'create').mockReturnValue(savedSubmission);
      jest.spyOn(submissionsRepository, 'save').mockResolvedValue(savedSubmission);

      const result = await service.submitTask('task-1', 'student-1', {
        content: 'My answer',
        attachmentUrls: ['https://example.com/homework.PDF?download=1'],
      });

      expect(result).toEqual(savedSubmission);
      expect(submissionsRepository.save).toHaveBeenCalledWith(savedSubmission);
    });
  });

  describe('gradeSubmission', () => {
    it('should save teacherFeedback when client sends teacherFeedback instead of feedback', async () => {
      const submission = {
        ...mockSubmission,
        task: mockTask,
      } as TaskSubmission;
      const savedSubmission = {
        ...submission,
        status: 'rejected',
        teacherFeedback: 'Needs more detail',
      } as TaskSubmission;
      const queryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          findOne: jest.fn().mockResolvedValue(submission),
          save: jest.fn().mockResolvedValue(savedSubmission),
        },
      };

      (submissionsRepository.manager.connection.createQueryRunner as jest.Mock).mockReturnValue(queryRunner);

      const result = await service.gradeSubmission(
        'submission-1',
        {
          status: 'rejected',
          teacherFeedback: 'Needs more detail',
        } as any,
        'teacher-1',
      );

      expect(result.teacherFeedback).toBe('Needs more detail');
      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          teacherFeedback: 'Needs more detail',
          reviewedBy: 'teacher-1',
        }),
      );
    });
  });
});

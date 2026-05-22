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
import { NotFoundException } from '@nestjs/common';
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
});

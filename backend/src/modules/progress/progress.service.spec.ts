import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgressService } from './progress.service';
import { UserZoneProgress } from './entities/user-zone-progress.entity';
import { AchievementsService } from '../achievements/achievements.service';

describe('ProgressService', () => {
  let service: ProgressService;
  let progressRepository: Repository<UserZoneProgress>;
  let achievementsService: AchievementsService;

  const mockProgress = {
    id: 'progress-1',
    userId: 'user-1',
    zoneId: 'zone-1',
    level: 1,
    experience: 0,
    tasksCompleted: 0,
    isUnlocked: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        {
          provide: getRepositoryToken(UserZoneProgress),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: AchievementsService,
          useValue: {
            checkAndUnlockAchievements: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
    progressRepository = module.get<Repository<UserZoneProgress>>(getRepositoryToken(UserZoneProgress));
    achievementsService = module.get<AchievementsService>(AchievementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addExperience', () => {
    it('should add experience and level up when threshold reached', async () => {
      jest.spyOn(progressRepository, 'findOne').mockResolvedValue(mockProgress as any);
      jest.spyOn(progressRepository, 'save').mockImplementation(async (progress) => progress as any);

      const result = await service.addExperience('user-1', 'zone-1', 1500);

      expect(result.level).toBe(2);
      expect(result.experience).toBe(1500);
    });

    it('should create new progress if none exists', async () => {
      jest.spyOn(progressRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(progressRepository, 'create').mockReturnValue(mockProgress as any);
      jest.spyOn(progressRepository, 'save').mockResolvedValue(mockProgress as any);

      const result = await service.addExperience('user-1', 'zone-1', 100);

      expect(progressRepository.create).toHaveBeenCalled();
    });
  });

  describe('incrementTasksCompleted', () => {
    it('should increment tasks completed count', async () => {
      jest.spyOn(progressRepository, 'findOne').mockResolvedValue(mockProgress as any);
      jest.spyOn(progressRepository, 'save').mockResolvedValue({ ...mockProgress, tasksCompleted: 1 } as any);

      const result = await service.incrementTasksCompleted('user-1', 'zone-1');

      expect(result.tasksCompleted).toBe(1);
    });
  });

  describe('getLeaderboard', () => {
    function mockLeaderboardQuery(rawRows: any[]) {
      const calls = {
        where: [] as any[],
        andWhere: [] as any[],
        orderBy: [] as any[],
      };
      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn((...args) => {
          calls.where.push(args);
          return queryBuilder;
        }),
        andWhere: jest.fn((...args) => {
          calls.andWhere.push(args);
          return queryBuilder;
        }),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(rawRows),
      };
      jest.spyOn(progressRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);
      return calls;
    }

    it('should apply zone filter when zoneId is provided', async () => {
      const calls = mockLeaderboardQuery([]);

      await service.getLeaderboard('biology-zone', 'score');

      expect(calls.andWhere).toContainEqual([
        'progress.zone_id = :zoneId',
        { zoneId: 'biology-zone' },
      ]);
    });

    it('should sort by average grade and preserve user ids from raw aliases', async () => {
      mockLeaderboardQuery([
        {
          userId: 'student-low',
          name: 'Low Grade',
          email: 'low@example.com',
          totalScore: '500',
          totalAchievements: '3',
          avgGrade: '70',
          tasksCompleted: '2',
          level: '1',
        },
        {
          userId: 'student-high',
          name: 'High Grade',
          email: 'high@example.com',
          totalScore: '100',
          totalAchievements: '1',
          avgGrade: '95',
          tasksCompleted: '1',
          level: '1',
        },
      ]);

      const result = await service.getLeaderboard(undefined, 'avgGrade');

      expect(result.map((entry) => entry.userId)).toEqual([
        'student-high',
        'student-low',
      ]);
      expect(result[0]).toEqual(
        expect.objectContaining({
          rank: 1,
          totalScore: 100,
          avgGrade: 95,
        }),
      );
    });
  });
});

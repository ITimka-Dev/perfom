import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AchievementsService } from './achievements.service';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { ConflictException } from '@nestjs/common';

describe('AchievementsService', () => {
  let service: AchievementsService;
  let achievementsRepository: Repository<Achievement>;
  let userAchievementsRepository: Repository<UserAchievement>;

  const mockAchievement = {
    id: 'achievement-1',
    name: 'First Steps',
    description: 'Complete your first task',
    icon: '🎯',
    conditionType: 'tasks_completed',
    conditionValue: 1,
  };

  const mockUserAchievement = {
    id: 'user-achievement-1',
    userId: 'user-1',
    achievementId: 'achievement-1',
    unlockedAt: new Date(),
    achievement: mockAchievement,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementsService,
        {
          provide: getRepositoryToken(Achievement),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserAchievement),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AchievementsService>(AchievementsService);
    achievementsRepository = module.get<Repository<Achievement>>(
      getRepositoryToken(Achievement),
    );
    userAchievementsRepository = module.get<Repository<UserAchievement>>(
      getRepositoryToken(UserAchievement),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllAchievements', () => {
    it('should return all achievements', async () => {
      jest.spyOn(achievementsRepository, 'find').mockResolvedValue([mockAchievement] as any);

      const result = await service.getAllAchievements();

      expect(result).toEqual([mockAchievement]);
    });
  });

  describe('getUserAchievements', () => {
    it('should return user achievements', async () => {
      jest.spyOn(userAchievementsRepository, 'find').mockResolvedValue([mockUserAchievement] as any);

      const result = await service.getUserAchievements('user-1');

      expect(result).toEqual([mockUserAchievement]);
    });
  });

  describe('unlockAchievement', () => {
    it('should unlock an achievement', async () => {
      jest.spyOn(userAchievementsRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userAchievementsRepository, 'create').mockReturnValue(mockUserAchievement as any);
      jest.spyOn(userAchievementsRepository, 'save').mockResolvedValue(mockUserAchievement as any);

      const result = await service.unlockAchievement('user-1', 'achievement-1');

      expect(result).toEqual(mockUserAchievement);
    });

    it('should throw ConflictException if already unlocked', async () => {
      jest.spyOn(userAchievementsRepository, 'findOne').mockResolvedValue(mockUserAchievement as any);

      await expect(
        service.unlockAchievement('user-1', 'achievement-1')
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('checkAndUnlockAchievements', () => {
    it('should check and unlock eligible achievements', async () => {
      jest.spyOn(achievementsRepository, 'find').mockResolvedValue([mockAchievement] as any);
      jest.spyOn(userAchievementsRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userAchievementsRepository, 'create').mockReturnValue(mockUserAchievement as any);
      jest.spyOn(userAchievementsRepository, 'save').mockResolvedValue(mockUserAchievement as any);

      const result = await service.checkAndUnlockAchievements('user-1', 'tasks_completed', 1);

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getUserAchievementProgress', () => {
    it('should return achievement progress', async () => {
      jest.spyOn(achievementsRepository, 'count').mockResolvedValue(10);
      jest.spyOn(userAchievementsRepository, 'count').mockResolvedValue(5);

      const result = await service.getUserAchievementProgress('user-1');

      expect(result).toEqual({
        total: 10,
        unlocked: 5,
        percentage: 50,
      });
    });
  });
});

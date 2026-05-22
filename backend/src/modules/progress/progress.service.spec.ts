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
      const progressWithExp = { ...mockProgress, experience: 1500 };
      
      jest.spyOn(progressRepository, 'findOne').mockResolvedValue(mockProgress as any);
      jest.spyOn(progressRepository, 'save').mockResolvedValue(progressWithExp as any);

      const result = await service.addExperience('user-1', 'zone-1', 1500);

      expect(result.level).toBe(2);
      expect(result.experience).toBe(500);
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
});

import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(Achievement)
    private achievementsRepo: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private userAchievementsRepo: Repository<UserAchievement>,
  ) {}

  async getAllAchievements(): Promise<Achievement[]> {
    return this.achievementsRepo.find();
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return this.userAchievementsRepo.find({
      where: { userId },
      relations: ['achievement'],
      order: { unlockedAt: 'DESC' },
    });
  }

  async unlockAchievement(
    userId: string,
    achievementId: string,
  ): Promise<UserAchievement> {
    // Check if already unlocked
    const existing = await this.userAchievementsRepo.findOne({
      where: { userId, achievementId },
    });

    if (existing) {
      throw new ConflictException('Achievement already unlocked');
    }

    const userAchievement = this.userAchievementsRepo.create({
      userId,
      achievementId,
      unlockedAt: new Date(),
    });

    return this.userAchievementsRepo.save(userAchievement);
  }

  async checkAndUnlockAchievements(
    userId: string,
    conditionType: string,
    currentValue: number,
  ): Promise<UserAchievement[]> {
    // Find all achievements of this type
    const achievements = await this.achievementsRepo.find({
      where: { conditionType },
    });

    const unlockedAchievements: UserAchievement[] = [];

    for (const achievement of achievements) {
      if (
        achievement.conditionValue &&
        currentValue >= achievement.conditionValue
      ) {
        try {
          const unlocked = await this.unlockAchievement(userId, achievement.id);
          unlockedAchievements.push(unlocked);
        } catch (error) {
          // Achievement already unlocked, continue
        }
      }
    }

    return unlockedAchievements;
  }

  async getUserAchievementProgress(userId: string): Promise<{
    total: number;
    unlocked: number;
    percentage: number;
  }> {
    const total = await this.achievementsRepo.count();
    const unlocked = await this.userAchievementsRepo.count({
      where: { userId },
    });

    return {
      total,
      unlocked,
      percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
    };
  }
}

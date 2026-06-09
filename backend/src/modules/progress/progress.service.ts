import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserZoneProgress } from './entities/user-zone-progress.entity';
import { AchievementsService } from '../achievements/achievements.service';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(UserZoneProgress)
    private progressRepo: Repository<UserZoneProgress>,
    @Inject(forwardRef(() => AchievementsService))
    private achievementsService: AchievementsService,
  ) {}

  async getOrCreateProgress(userId: string, zoneId: string): Promise<UserZoneProgress> {
    let progress = await this.progressRepo.findOne({
      where: { userId, zoneId },
    });

    if (!progress) {
      progress = this.progressRepo.create({
        userId,
        zoneId,
        level: 1,
        experience: 0,
        tasksCompleted: 0,
        isUnlocked: true,
      });
      progress = await this.progressRepo.save(progress);
    }

    return progress;
  }

  async addExperience(
    userId: string,
    zoneId: string,
    experienceAmount: number,
  ): Promise<UserZoneProgress> {
    const progress = await this.getOrCreateProgress(userId, zoneId);
    
    progress.experience += experienceAmount;
    
    // Calculate level (1000 XP per level)
    const newLevel = Math.floor(progress.experience / 1000) + 1;
    const leveledUp = newLevel > progress.level;
    progress.level = newLevel;
    
    const savedProgress = await this.progressRepo.save(progress);

    // Check for level achievements
    if (leveledUp) {
      await this.achievementsService.checkAndUnlockAchievements(
        userId,
        'level_reached',
        progress.level,
      );
    }

    // Check for XP achievements
    await this.achievementsService.checkAndUnlockAchievements(
      userId,
      'xp_earned',
      progress.experience,
    );

    return savedProgress;
  }

  async incrementTasksCompleted(
    userId: string,
    zoneId: string,
  ): Promise<UserZoneProgress> {
    const progress = await this.getOrCreateProgress(userId, zoneId);
    
    progress.tasksCompleted += 1;
    
    const savedProgress = await this.progressRepo.save(progress);

    // Check for task completion achievements
    await this.achievementsService.checkAndUnlockAchievements(
      userId,
      'tasks_completed',
      progress.tasksCompleted,
    );

    return savedProgress;
  }

  async getUserProgress(userId: string): Promise<UserZoneProgress[]> {
    return this.progressRepo.find({
      where: { userId },
      relations: ['zone'],
      order: { level: 'DESC' },
    });
  }

  async getZoneProgress(userId: string, zoneId: string): Promise<UserZoneProgress | null> {
    return this.progressRepo.findOne({
      where: { userId, zoneId },
      relations: ['zone'],
    });
  }

  async getLeaderboard(zoneId?: string, sortBy: 'score' | 'achievements' | 'avgGrade' = 'score'): Promise<any[]> {
    const query = this.progressRepo
      .createQueryBuilder('progress')
      .leftJoin('progress.user', 'user')
      .leftJoin('user.profile', 'profile')
      .leftJoin('user_achievements', 'ua', 'ua.user_id = user.id')
      .leftJoin('task_submissions', 'sub', 'sub.user_id = user.id AND sub.status = \'reviewed\' AND sub.grade IS NOT NULL')
      .select('user.id', 'userId')
      .addSelect('COALESCE(profile.full_name, user.email)', 'name')
      .addSelect('user.email', 'email')
      .addSelect('SUM(progress.experience)', 'totalScore')
      .addSelect('COUNT(DISTINCT ua.achievement_id)', 'totalAchievements')
      .addSelect('COALESCE(AVG(sub.grade), 0)', 'avgGrade')
      .addSelect('SUM(progress.tasks_completed)', 'tasksCompleted')
      .addSelect('MAX(progress.level)', 'level')
      .where('user.role = :role', { role: 'student' })
      .groupBy('user.id, profile.full_name, user.email');

    if (zoneId) {
      query.andWhere('progress.zone_id = :zoneId', { zoneId });
    }

    const results = (await query.getRawMany()).map((entry) =>
      this.normalizeLeaderboardEntry(entry),
    );

    // Sort by selected metric
    if (sortBy === 'achievements') {
      results.sort((a, b) => b.totalAchievements - a.totalAchievements || b.totalScore - a.totalScore);
    } else if (sortBy === 'avgGrade') {
      results.sort((a, b) => b.avgGrade - a.avgGrade || b.totalScore - a.totalScore);
    } else {
      results.sort((a, b) => b.totalScore - a.totalScore);
    }

    // Add rank
    return results.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      name: entry.name,
      email: entry.email,
      totalScore: entry.totalScore,
      totalAchievements: entry.totalAchievements,
      avgGrade: Math.round(entry.avgGrade * 10) / 10,
      tasksCompleted: entry.tasksCompleted,
      level: entry.level,
    }));
  }

  private normalizeLeaderboardEntry(entry: Record<string, any>) {
    return {
      userId: this.getRawValue(entry, 'userId', 'userid'),
      name: this.getRawValue(entry, 'name'),
      email: this.getRawValue(entry, 'email'),
      totalScore: parseInt(this.getRawValue(entry, 'totalScore', 'totalscore') || '0', 10),
      totalAchievements: parseInt(this.getRawValue(entry, 'totalAchievements', 'totalachievements') || '0', 10),
      avgGrade: parseFloat(this.getRawValue(entry, 'avgGrade', 'avggrade') || '0'),
      tasksCompleted: parseInt(this.getRawValue(entry, 'tasksCompleted', 'taskscompleted') || '0', 10),
      level: parseInt(this.getRawValue(entry, 'level') || '1', 10),
    };
  }

  private getRawValue(entry: Record<string, any>, ...keys: string[]) {
    for (const key of keys) {
      if (entry[key] !== undefined && entry[key] !== null) {
        return entry[key];
      }
    }
    return undefined;
  }
}

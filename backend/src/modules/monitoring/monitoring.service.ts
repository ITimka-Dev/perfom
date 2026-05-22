import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { TaskSubmission } from '../tasks/entities/task-submission.entity';

interface ErrorLog {
  timestamp: string;
  level: string;
  message: string;
  stack?: string;
}

export interface Metrics {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  errors: {
    total: number;
    last24Hours: number;
    recentErrors: ErrorLog[];
  };
  requests: {
    totalProcessed: number;
    averageResponseTime: number;
  };
}

@Injectable()
export class MonitoringService {
  private requestCount = 0;
  private totalResponseTime = 0;
  private errorCount = 0;
  private errors24h = 0;
  private lastErrorReset = Date.now();

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(TaskSubmission)
    private submissionsRepository: Repository<TaskSubmission>,
  ) {}

  incrementRequestCount(responseTime: number) {
    this.requestCount++;
    this.totalResponseTime += responseTime;
  }

  incrementErrorCount() {
    this.errorCount++;
    this.errors24h++;
    
    // Reset 24h counter every 24 hours
    const now = Date.now();
    if (now - this.lastErrorReset > 24 * 60 * 60 * 1000) {
      this.errors24h = 0;
      this.lastErrorReset = now;
    }
  }

  getMetrics(): Metrics {
    const recentErrors = this.getRecentErrors(10);

    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      errors: {
        total: this.errorCount,
        last24Hours: this.errors24h,
        recentErrors,
      },
      requests: {
        totalProcessed: this.requestCount,
        averageResponseTime: this.requestCount > 0 
          ? this.totalResponseTime / this.requestCount 
          : 0,
      },
    };
  }

  private getRecentErrors(limit: number = 10): ErrorLog[] {
    try {
      const errorLogPath = join(process.cwd(), 'logs', 'error.log');
      
      if (!existsSync(errorLogPath)) {
        return [];
      }

      const content = readFileSync(errorLogPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // Get last N lines
      const recentLines = lines.slice(-limit);
      
      return recentLines.map(line => {
        try {
          // Parse log line (format: timestamp level [context] message)
          const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) (\w+) (.+)$/);
          
          if (match) {
            return {
              timestamp: match[1],
              level: match[2],
              message: match[3],
            };
          }
        } catch (error) {
          // Skip malformed lines
        }
        
        return {
          timestamp: new Date().toISOString(),
          level: 'error',
          message: line,
        };
      });
    } catch (error) {
      return [];
    }
  }

  getHealthStatus(): { status: string; checks: any } {
    const memUsage = process.memoryUsage();
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    return {
      status: memUsagePercent < 90 && this.errors24h < 100 ? 'healthy' : 'degraded',
      checks: {
        memory: {
          status: memUsagePercent < 90 ? 'ok' : 'warning',
          usage: `${memUsagePercent.toFixed(2)}%`,
          heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        },
        errors: {
          status: this.errors24h < 100 ? 'ok' : 'warning',
          count24h: this.errors24h,
        },
        uptime: {
          status: 'ok',
          seconds: Math.floor(process.uptime()),
          formatted: this.formatUptime(process.uptime()),
        },
      },
    };
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
  }

  async getAdminStats() {
    // Total users count
    const totalUsers = await this.usersRepository.count();
    
    // Students and teachers count
    const totalStudents = await this.usersRepository.count({
      where: { role: 'student' },
    });
    const totalTeachers = await this.usersRepository.count({
      where: { role: 'teacher' },
    });

    // Tasks and submissions
    const totalTasks = await this.tasksRepository.count();
    const totalSubmissions = await this.submissionsRepository.count();
    const pendingSubmissions = await this.submissionsRepository.count({
      where: { status: 'pending' },
    });

    // Average grade
    const avgGradeResult = await this.submissionsRepository
      .createQueryBuilder('submission')
      .select('AVG(submission.grade)', 'avg')
      .where('submission.status = :status', { status: 'reviewed' })
      .andWhere('submission.grade IS NOT NULL')
      .getRawOne();
    const avgGrade = parseFloat(avgGradeResult?.avg || '0');

    // Active users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = await this.submissionsRepository
      .createQueryBuilder('submission')
      .select('COUNT(DISTINCT submission.user_id)', 'count')
      .where('submission.submitted_at >= :today', { today })
      .getRawOne();

    // Active users this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const activeThisWeek = await this.submissionsRepository
      .createQueryBuilder('submission')
      .select('COUNT(DISTINCT submission.user_id)', 'count')
      .where('submission.submitted_at >= :weekAgo', { weekAgo })
      .getRawOne();

    // Recent activity (last 7 days)
    const recentActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const submissions = await this.submissionsRepository.count({
        where: {
          submittedAt: Between(date, nextDate),
        },
      });

      const reviews = await this.submissionsRepository.count({
        where: {
          reviewedAt: Between(date, nextDate),
          status: 'reviewed',
        },
      });

      recentActivity.push({
        date: date.toISOString().split('T')[0],
        submissions,
        reviews,
      });
    }

    return {
      totalUsers,
      totalStudents,
      totalTeachers,
      totalTasks,
      totalSubmissions,
      pendingSubmissions,
      avgGrade: Math.round(avgGrade * 10) / 10,
      activeToday: parseInt(activeToday?.count || '0', 10),
      activeThisWeek: parseInt(activeThisWeek?.count || '0', 10),
      recentActivity,
    };
  }

  getHealth() {
    return this.getHealthStatus();
  }

  getStats() {
    return this.getMetrics();
  }

  async getDashboardData() {
    return {
      health: this.getHealthStatus(),
      metrics: this.getMetrics(),
      adminStats: await this.getAdminStats(),
    };
  }

  async getWeeklyReports(teacherId: string) {
    // This would query a weekly_reports table in your database
    // For now returning empty array as placeholder
    return [];
  }

  async getWeeklyReport(teacherId: string, weekStart: string) {
    // This would fetch a specific weekly report
    // For now returning null as placeholder
    return null;
  }
}


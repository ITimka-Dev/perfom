import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TasksGateway } from './tasks.gateway';
import { Task } from './entities/task.entity';
import { TaskSubmission } from './entities/task-submission.entity';
import { SubmissionComment } from './entities/submission-comment.entity';
import { CommentTemplate } from './entities/comment-template.entity';
import { ProgressModule } from '../progress/progress.module';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskSubmission, SubmissionComment, CommentTemplate]),
    forwardRef(() => ProgressModule),
    forwardRef(() => AchievementsModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksGateway],
  exports: [TasksService, TasksGateway],
})
export class TasksModule {}

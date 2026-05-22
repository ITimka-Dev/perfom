import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringService } from './monitoring.service';
import { MonitoringController } from './monitoring.controller';
import { PrometheusService } from './prometheus.service';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { TaskSubmission } from '../tasks/entities/task-submission.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User, Task, TaskSubmission])],
  controllers: [MonitoringController],
  providers: [MonitoringService, PrometheusService],
  exports: [MonitoringService, PrometheusService],
})
export class MonitoringModule {}

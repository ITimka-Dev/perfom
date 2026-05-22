import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { StudentGroup } from './entities/student-group.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupTask } from './entities/group-task.entity';
import { User } from '../users/entities/user.entity';
import { TaskSubmission } from '../tasks/entities/task-submission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentGroup,
      GroupMember,
      GroupTask,
      User,
      TaskSubmission,
    ]),
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}

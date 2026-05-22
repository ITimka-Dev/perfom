import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StudentGroup } from './student-group.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity('group_tasks')
export class GroupTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id' })
  groupId: string;

  @ManyToOne(() => StudentGroup)
  @JoinColumn({ name: 'group_id' })
  group: StudentGroup;

  @Column({ name: 'task_id' })
  taskId: string;

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt: Date;

  @Column({ name: 'due_date', nullable: true })
  dueDate: Date;
}

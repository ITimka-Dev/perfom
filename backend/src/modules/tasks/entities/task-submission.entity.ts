import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Task } from './task.entity';

@Entity('task_submissions')
export class TaskSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  taskId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'text', nullable: true })
  submissionText: string;

  @Column({ type: 'text', array: true, nullable: true })
  fileUrls: string[];

  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'reviewed' | 'rejected';

  @Column({ type: 'int', nullable: true })
  grade: number;

  @Column({ type: 'text', nullable: true })
  teacherFeedback: string;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string;

  @CreateDateColumn()
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'taskId' })
  task: Task;
}

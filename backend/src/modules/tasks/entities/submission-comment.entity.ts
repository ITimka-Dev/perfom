import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TaskSubmission } from './task-submission.entity';

@Entity('submission_comments')
export class SubmissionComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'submission_id' })
  submissionId: string;

  @Column({ type: 'uuid', name: 'teacher_id' })
  teacherId: string;

  @Column({ type: 'text', name: 'comment_text' })
  commentText: string;

  @Column({ type: 'text', array: true, name: 'file_urls', default: '{}' })
  fileUrls: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => TaskSubmission)
  @JoinColumn({ name: 'submission_id' })
  submission: TaskSubmission;
}

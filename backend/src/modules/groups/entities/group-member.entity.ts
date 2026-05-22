import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StudentGroup } from './student-group.entity';
import { User } from '../../users/entities/user.entity';

@Entity('group_members')
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id' })
  groupId: string;

  @ManyToOne(() => StudentGroup)
  @JoinColumn({ name: 'group_id' })
  group: StudentGroup;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { FarmZone } from '../../zones/entities/farm-zone.entity';

@Entity('teacher_subjects')
export class TeacherSubject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  zoneId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => FarmZone, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zoneId' })
  zone: FarmZone;

  @CreateDateColumn()
  createdAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FarmZone } from '../../zones/entities/farm-zone.entity';

@Entity('user_zone_progress')
export class UserZoneProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'zone_id' })
  zoneId: string;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  experience: number;

  @Column({ name: 'tasks_completed', default: 0 })
  tasksCompleted: number;

  @Column({ name: 'is_unlocked', default: true })
  isUnlocked: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => FarmZone)
  @JoinColumn({ name: 'zone_id' })
  zone: FarmZone;
}

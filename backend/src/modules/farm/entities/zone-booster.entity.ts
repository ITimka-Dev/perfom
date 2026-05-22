import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('zone_boosters')
export class ZoneBooster {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'zone_id' })
  zoneId: string;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'int' })
  cooldown: number;

  @Column({ name: 'speed_multiplier', type: 'numeric', default: 1.0 })
  speedMultiplier: number;

  @Column({ name: 'unlock_achievement_id', nullable: true })
  unlockAchievementId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

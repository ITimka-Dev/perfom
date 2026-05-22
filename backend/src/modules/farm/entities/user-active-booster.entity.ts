import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ZoneBooster } from './zone-booster.entity';

@Entity('user_active_boosters')
export class UserActiveBooster {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'booster_id' })
  boosterId: string;

  @Column({ name: 'activated_at', type: 'timestamptz', default: () => 'now()' })
  activatedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'can_activate_again_at', type: 'timestamptz' })
  canActivateAgainAt: Date;

  @ManyToOne(() => ZoneBooster)
  @JoinColumn({ name: 'booster_id' })
  booster: ZoneBooster;
}

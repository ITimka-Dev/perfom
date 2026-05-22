import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { FarmItem } from './farm-item.entity';

@Entity('user_plants')
export class UserPlant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  zoneId: string;

  @Column({ type: 'uuid' })
  seedItemId: string;

  @Column({ type: 'int' })
  slotIndex: number;

  @Column({ type: 'timestamp' })
  plantedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  wateredAt: Date;

  @Column({ type: 'boolean', default: false })
  needsWater: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => FarmItem)
  @JoinColumn({ name: 'seedItemId' })
  seedItem: FarmItem;
}

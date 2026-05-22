import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('farm_items')
export class FarmItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar' })
  category: 'seed' | 'crop' | 'animal_product' | 'processed';

  @Column()
  iconEmoji: string;

  @Column({ type: 'uuid', nullable: true })
  zoneId: string;

  @Column({ type: 'int', nullable: true })
  productionTime: number;

  @Column({ type: 'int', default: 0 })
  sellPriceNpc: number;

  @Column({ type: 'int', default: 0 })
  unlockTasksRequired: number;

  @CreateDateColumn()
  createdAt: Date;
}

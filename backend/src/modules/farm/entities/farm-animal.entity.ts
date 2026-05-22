import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('farm_animals')
export class FarmAnimal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  iconEmoji: string;

  @Column({ type: 'uuid' })
  zoneId: string;

  @Column({ type: 'uuid', nullable: true })
  feedItemId: string;

  @Column({ type: 'uuid' })
  productionItemId: string;

  @Column({ type: 'int' })
  productionTime: number;

  @Column({ type: 'int', default: 100 })
  maxHappiness: number;

  @Column({ type: 'int', default: 0 })
  unlockTasksRequired: number;

  @CreateDateColumn()
  createdAt: Date;
}

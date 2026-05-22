import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ type: 'int', default: 100 })
  hunger: number;

  @Column({ type: 'int', default: 100 })
  thirst: number;

  @Column({ type: 'int', default: 100 })
  happiness: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastFedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastWateredAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastPlayedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  ranAwayAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

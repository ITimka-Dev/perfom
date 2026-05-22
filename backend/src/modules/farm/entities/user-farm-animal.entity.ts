import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { FarmAnimal } from './farm-animal.entity';

@Entity('user_farm_animals')
export class UserFarmAnimal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  animalId: string;

  @Column({ type: 'int', default: 100 })
  happiness: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastFedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastCollectedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => FarmAnimal)
  @JoinColumn({ name: 'animalId' })
  animal: FarmAnimal;
}

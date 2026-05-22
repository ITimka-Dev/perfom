import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProductionChain } from './production-chain.entity';

@Entity('user_productions')
export class UserProduction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  zoneId: string;

  @Column({ type: 'uuid' })
  chainId: string;

  @Column({ type: 'int' })
  slotIndex: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startedAt: Date;

  @Column({ type: 'timestamp' })
  finishAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ProductionChain)
  @JoinColumn({ name: 'chainId' })
  chain: ProductionChain;
}

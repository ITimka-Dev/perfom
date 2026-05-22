import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ProductionChainIngredient } from './production-chain-ingredient.entity';
import { FarmItem } from './farm-item.entity';

@Entity('production_chains')
export class ProductionChain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'uuid' })
  zoneId: string;

  @Column({ type: 'uuid' })
  outputItemId: string;

  @Column({ type: 'int', default: 1 })
  outputQuantity: number;

  @Column({ type: 'int' })
  baseTime: number;

  @Column({ type: 'int', default: 0 })
  unlockTasksRequired: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ProductionChainIngredient, (ingredient) => ingredient.chain)
  ingredients: ProductionChainIngredient[];

  @ManyToOne(() => FarmItem)
  @JoinColumn({ name: 'outputItemId' })
  outputItem: FarmItem;
}

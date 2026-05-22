import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ProductionChain } from './production-chain.entity';
import { FarmItem } from './farm-item.entity';

@Entity('production_chain_ingredients')
export class ProductionChainIngredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  chainId: string;

  @Column({ type: 'uuid' })
  itemId: string;

  @Column({ type: 'int' })
  quantityNeeded: number;

  @ManyToOne(() => ProductionChain, (chain) => chain.ingredients)
  @JoinColumn({ name: 'chainId' })
  chain: ProductionChain;

  @ManyToOne(() => FarmItem)
  @JoinColumn({ name: 'itemId' })
  item: FarmItem;
}

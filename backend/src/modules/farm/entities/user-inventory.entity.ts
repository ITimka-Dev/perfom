import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { FarmItem } from './farm-item.entity';

@Entity('user_inventory')
export class UserInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  itemId: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @ManyToOne(() => FarmItem)
  @JoinColumn({ name: 'itemId' })
  item: FarmItem;
}

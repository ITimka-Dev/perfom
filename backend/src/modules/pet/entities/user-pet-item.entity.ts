import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PetShopItem } from './pet-shop-item.entity';

@Entity('user_pet_items')
export class UserPetItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  itemId: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @CreateDateColumn()
  purchasedAt: Date;

  @ManyToOne(() => PetShopItem)
  @JoinColumn({ name: 'itemId' })
  item: PetShopItem;
}

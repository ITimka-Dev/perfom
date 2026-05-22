import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('pet_shop_items')
export class PetShopItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  itemType: string;

  @Column()
  iconEmoji: string;

  @Column({ type: 'boolean', default: true })
  isConsumable: boolean;

  @Column({ type: 'int', default: 0 })
  statEffectHunger: number;

  @Column({ type: 'int', default: 0 })
  statEffectThirst: number;

  @Column({ type: 'int', default: 0 })
  statEffectHappiness: number;

  @CreateDateColumn()
  createdAt: Date;
}

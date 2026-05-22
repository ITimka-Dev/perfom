import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'trophy' })
  icon: string;

  @Column({ type: 'varchar', default: 'common' })
  rarity: 'common' | 'rare' | 'epic' | 'legendary';

  @Column({ type: 'text', nullable: true })
  conditionType: string;

  @Column({ type: 'int', nullable: true })
  conditionValue: number;

  @CreateDateColumn()
  createdAt: Date;
}

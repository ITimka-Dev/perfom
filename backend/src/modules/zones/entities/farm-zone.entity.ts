import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('farm_zones')
export class FarmZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  zoneType: 'biology' | 'chemistry' | 'physics' | 'mathematics' | 'it';

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  iconUrl: string;

  @Column({ type: 'int', default: 1 })
  unlockLevel: number;

  @Column({ type: 'text', array: true, default: "ARRAY['plants', 'animals', 'production']" })
  allowedSlotTypes: string[];

  @CreateDateColumn()
  createdAt: Date;
}

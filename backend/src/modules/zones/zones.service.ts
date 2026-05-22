import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FarmZone } from './entities/farm-zone.entity';

@Injectable()
export class ZonesService {
  constructor(
    @InjectRepository(FarmZone)
    private zonesRepository: Repository<FarmZone>,
  ) {}

  async findAll(): Promise<FarmZone[]> {
    return this.zonesRepository.find({
      order: { name: 'ASC' },
      cache: 300000, // Cache for 5 minutes (rarely changes)
    });
  }

  async findOne(id: string): Promise<FarmZone> {
    return this.zonesRepository.findOne({ where: { id } });
  }
}

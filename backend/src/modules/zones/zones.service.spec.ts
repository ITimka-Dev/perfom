import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZonesService } from './zones.service';
import { FarmZone } from './entities/farm-zone.entity';

describe('ZonesService', () => {
  let service: ZonesService;
  let zonesRepository: Repository<FarmZone>;

  const mockZone = {
    id: 'zone-1',
    name: 'Математика',
    description: 'Зона математики',
    color: '#FF5733',
    icon: '🔢',
    requiredLevel: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZonesService,
        {
          provide: getRepositoryToken(FarmZone),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ZonesService>(ZonesService);
    zonesRepository = module.get<Repository<FarmZone>>(getRepositoryToken(FarmZone));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all zones', async () => {
      const mockZones = [mockZone, { ...mockZone, id: 'zone-2', name: 'Физика' }];
      jest.spyOn(zonesRepository, 'find').mockResolvedValue(mockZones as any);

      const result = await service.findAll();

      expect(result).toEqual(mockZones);
      expect(zonesRepository.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single zone', async () => {
      jest.spyOn(zonesRepository, 'findOne').mockResolvedValue(mockZone as any);

      const result = await service.findOne('zone-1');

      expect(result).toEqual(mockZone);
      expect(zonesRepository.findOne).toHaveBeenCalledWith({ where: { id: 'zone-1' } });
    });

    it('should return null if zone not found', async () => {
      jest.spyOn(zonesRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findOne('non-existent');

      expect(result).toBeNull();
    });
  });
});

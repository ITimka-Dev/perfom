import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FarmService } from './farm.service';
import { UserPlant } from './entities/user-plant.entity';
import { UserFarmAnimal } from './entities/user-farm-animal.entity';
import { UserProduction } from './entities/user-production.entity';
import { UserInventory } from './entities/user-inventory.entity';
import { FarmItem } from './entities/farm-item.entity';
import { FarmAnimal } from './entities/farm-animal.entity';
import { ProductionChain } from './entities/production-chain.entity';
import { FarmGateway } from './farm.gateway';
import { NotFoundException } from '@nestjs/common';

describe('FarmService', () => {
  let service: FarmService;
  let plantsRepository: Repository<UserPlant>;
  let inventoryRepository: Repository<UserInventory>;
  let farmGateway: FarmGateway;

  const mockPlant: Partial<UserPlant> = {
    id: 'plant-1',
    userId: 'user-1',
    seedItemId: 'item-1',
    slotIndex: 1,
    zoneId: 'zone-1',
    plantedAt: new Date(),
    wateredAt: null,
    needsWater: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FarmService,
        {
          provide: getRepositoryToken(UserPlant),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserFarmAnimal),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserProduction),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserInventory),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(FarmItem),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(FarmAnimal),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProductionChain),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: FarmGateway,
          useValue: {
            server: {
              to: jest.fn().mockReturnThis(),
              emit: jest.fn(),
            },
            notifyPlantUpdate: jest.fn(),
            notifyPlantHarvested: jest.fn(),
            notifyAnimalUpdate: jest.fn(),
            notifyAnimalCollected: jest.fn(),
            notifyProductionStarted: jest.fn(),
            notifyProductionCompleted: jest.fn(),
            notifyInventoryUpdate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FarmService>(FarmService);
    plantsRepository = module.get<Repository<UserPlant>>(getRepositoryToken(UserPlant));
    inventoryRepository = module.get<Repository<UserInventory>>(getRepositoryToken(UserInventory));
    farmGateway = module.get<FarmGateway>(FarmGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserPlants', () => {
    it('should return user plants for a zone', async () => {
      jest.spyOn(plantsRepository, 'find').mockResolvedValue([mockPlant as UserPlant]);

      const result = await service.getUserPlants('user-1', 'zone-1');

      expect(result).toEqual([mockPlant]);
      expect(plantsRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1', zoneId: 'zone-1' },
        relations: ['seedItem'],
      });
    });
  });

  describe('waterPlant', () => {
    it('should water a plant and update wateredAt', async () => {
      const wateredPlant = { ...mockPlant, wateredAt: new Date(), needsWater: false };
      
      jest.spyOn(plantsRepository, 'findOne').mockResolvedValue(mockPlant as UserPlant);
      jest.spyOn(plantsRepository, 'save').mockResolvedValue(wateredPlant as UserPlant);

      const result = await service.waterPlant('user-1', 'plant-1');

      expect(result.wateredAt).toBeDefined();
      expect(result.needsWater).toBe(false);
      expect(farmGateway.notifyPlantUpdate).toHaveBeenCalled();
    });

    it('should throw NotFoundException if plant not found', async () => {
      jest.spyOn(plantsRepository, 'findOne').mockResolvedValue(null);

      await expect(service.waterPlant('user-1', 'plant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getInventory', () => {
    it('should return user inventory', async () => {
      const mockInventory = [
        { userId: 'user-1', itemId: 'item-1', quantity: 10 },
      ];

      jest.spyOn(inventoryRepository, 'find').mockResolvedValue(mockInventory as UserInventory[]);

      const result = await service.getInventory('user-1');

      expect(result).toEqual(mockInventory);
    });
  });
});

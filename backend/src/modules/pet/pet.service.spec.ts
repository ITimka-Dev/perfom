import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PetService } from './pet.service';
import { Pet } from './entities/pet.entity';
import { PetShopItem } from './entities/pet-shop-item.entity';
import { UserPetItem } from './entities/user-pet-item.entity';
import { PetGateway } from './pet.gateway';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreatePetDto } from './dto/create-pet.dto';

describe('PetService', () => {
  let service: PetService;
  let petsRepository: Repository<Pet>;
  let petGateway: PetGateway;

  const mockPet: Partial<Pet> = {
    id: 'pet-1',
    userId: 'user-1',
    name: 'Fluffy',
    type: 'cow',
    hunger: 80,
    thirst: 70,
    happiness: 90,
    lastFedAt: new Date(),
    lastWateredAt: new Date(),
    lastPlayedAt: new Date(),
    ranAwayAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetService,
        {
          provide: getRepositoryToken(Pet),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PetShopItem),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserPetItem),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: PetGateway,
          useValue: {
            notifyPetCreated: jest.fn(),
            notifyPetStatsUpdate: jest.fn(),
            notifyPetFed: jest.fn(),
            notifyPetWatered: jest.fn(),
            notifyPetPlayed: jest.fn(),
            notifyPetItemUsed: jest.fn(),
            notifyPetRanAway: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PetService>(PetService);
    petsRepository = module.get<Repository<Pet>>(getRepositoryToken(Pet));
    petGateway = module.get<PetGateway>(PetGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserPet', () => {
    it('should return user pet', async () => {
      jest.spyOn(petsRepository, 'findOne').mockResolvedValue(mockPet as Pet);

      const result = await service.getUserPet('user-1');

      expect(result).toEqual(mockPet);
    });

    it('should return null if pet not found', async () => {
      jest.spyOn(petsRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getUserPet('user-1');

      expect(result).toBeNull();
    });
  });

  describe('createPet', () => {
    it('should create a new pet', async () => {
      const createPetDto: CreatePetDto = {
        name: 'Fluffy',
        type: 'cow',
      };

      jest.spyOn(petsRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(petsRepository, 'create').mockReturnValue(mockPet as Pet);
      jest.spyOn(petsRepository, 'save').mockResolvedValue(mockPet as Pet);

      const result = await service.createPet('user-1', createPetDto);

      expect(result).toEqual(mockPet);
      expect(petGateway.notifyPetCreated).toHaveBeenCalled();
    });

    it('should throw ConflictException if pet already exists', async () => {
      jest.spyOn(petsRepository, 'findOne').mockResolvedValue(mockPet as Pet);

      const createPetDto: CreatePetDto = { name: 'Fluffy', type: 'cow' };
      await expect(
        service.createPet('user-1', createPetDto)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('feedPet', () => {
    it('should feed pet and increase hunger', async () => {
      jest.spyOn(petsRepository, 'findOne').mockResolvedValue(mockPet as Pet);
      jest.spyOn(petsRepository, 'save').mockResolvedValue({ ...mockPet, hunger: 100 } as Pet);

      const result = await service.feedPet('user-1');

      expect(result.hunger).toBe(100);
      expect(petGateway.notifyPetFed).toHaveBeenCalled();
    });

    it('should throw NotFoundException if pet not found', async () => {
      jest.spyOn(petsRepository, 'findOne').mockResolvedValue(null);

      await expect(service.feedPet('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('waterPet', () => {
    it('should water pet and increase thirst', async () => {
      jest.spyOn(petsRepository, 'findOne').mockResolvedValue(mockPet as Pet);
      jest.spyOn(petsRepository, 'save').mockResolvedValue({ ...mockPet, thirst: 100 } as Pet);

      const result = await service.waterPet('user-1');

      expect(result.thirst).toBe(100);
      expect(petGateway.notifyPetWatered).toHaveBeenCalled();
    });
  });

  describe('playWithPet', () => {
    it('should play with pet and increase happiness', async () => {
      jest.spyOn(petsRepository, 'findOne').mockResolvedValue(mockPet as Pet);
      jest.spyOn(petsRepository, 'save').mockResolvedValue({ ...mockPet, happiness: 100 } as Pet);

      const result = await service.playWithPet('user-1');

      expect(result.happiness).toBe(100);
      expect(petGateway.notifyPetPlayed).toHaveBeenCalled();
    });
  });
});

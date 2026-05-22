import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FarmItem } from './entities/farm-item.entity';
import { UserInventory } from './entities/user-inventory.entity';
import { UserPlant } from './entities/user-plant.entity';
import { FarmAnimal } from './entities/farm-animal.entity';
import { UserFarmAnimal } from './entities/user-farm-animal.entity';
import { ProductionChain } from './entities/production-chain.entity';
import { UserProduction } from './entities/user-production.entity';
import { ZoneBooster } from './entities/zone-booster.entity';
import { UserActiveBooster } from './entities/user-active-booster.entity';
import { PlantSeedDto } from './dto/plant-seed.dto';
import { StartProductionDto } from './dto/start-production.dto';
import { FarmGateway } from './farm.gateway';

@Injectable()
export class FarmService {
  constructor(
    @InjectRepository(FarmItem)
    private farmItemsRepo: Repository<FarmItem>,
    @InjectRepository(UserInventory)
    private inventoryRepo: Repository<UserInventory>,
    @InjectRepository(UserPlant)
    private plantsRepo: Repository<UserPlant>,
    @InjectRepository(FarmAnimal)
    private farmAnimalsRepo: Repository<FarmAnimal>,
    @InjectRepository(UserFarmAnimal)
    private userAnimalsRepo: Repository<UserFarmAnimal>,
    @InjectRepository(ProductionChain)
    private productionChainsRepo: Repository<ProductionChain>,
    @InjectRepository(UserProduction)
    private userProductionsRepo: Repository<UserProduction>,
    @InjectRepository(ZoneBooster)
    private zoneBoostersRepo: Repository<ZoneBooster>,
    @InjectRepository(UserActiveBooster)
    private userActiveBoostersRepo: Repository<UserActiveBooster>,
    @Inject(forwardRef(() => FarmGateway))
    private farmGateway: FarmGateway,
  ) {}

  // Inventory
  async getInventory(userId: string): Promise<UserInventory[]> {
    return this.inventoryRepo.find({
      where: { userId },
      relations: ['item'],
      cache: 30000, // Cache for 30 seconds
    });
  }

  async addToInventory(userId: string, itemId: string, quantity: number): Promise<void> {
    let inventory = await this.inventoryRepo.findOne({
      where: { userId, itemId },
    });

    if (inventory) {
      inventory.quantity += quantity;
    } else {
      inventory = this.inventoryRepo.create({ userId, itemId, quantity });
    }

    await this.inventoryRepo.save(inventory);
  }

  async removeFromInventory(userId: string, itemId: string, quantity: number): Promise<void> {
    const inventory = await this.inventoryRepo.findOne({
      where: { userId, itemId },
    });

    if (!inventory || inventory.quantity < quantity) {
      throw new BadRequestException('Not enough items in inventory');
    }

    inventory.quantity -= quantity;
    await this.inventoryRepo.save(inventory);
  }

  // Plants
  async getUserPlants(userId: string, zoneId: string): Promise<UserPlant[]> {
    return this.plantsRepo.find({
      where: { userId, zoneId },
      relations: ['seedItem'],
    });
  }

  async plantSeed(userId: string, plantSeedDto: PlantSeedDto): Promise<UserPlant> {
    // Check if user has the seed
    await this.removeFromInventory(userId, plantSeedDto.seedItemId, 1);

    const plant = this.plantsRepo.create({
      userId,
      zoneId: plantSeedDto.zoneId,
      seedItemId: plantSeedDto.seedItemId,
      slotIndex: plantSeedDto.slotIndex,
      plantedAt: new Date(),
    });

    const savedPlant = await this.plantsRepo.save(plant);

    // Get updated inventory
    const inventory = await this.getInventory(userId);

    this.farmGateway.notifyPlantUpdate(userId, savedPlant);
    this.farmGateway.notifyInventoryUpdate(userId, inventory);
    
    return savedPlant;
  }

  async waterPlant(userId: string, plantId: string): Promise<UserPlant> {
    const plant = await this.plantsRepo.findOne({
      where: { id: plantId, userId },
    });

    if (!plant) {
      throw new NotFoundException('Plant not found');
    }

    plant.wateredAt = new Date();
    plant.needsWater = false;

    const savedPlant = await this.plantsRepo.save(plant);
    this.farmGateway.notifyPlantUpdate(userId, savedPlant);
    
    return savedPlant;
  }

  async harvestPlant(userId: string, plantId: string): Promise<void> {
    const queryRunner = this.plantsRepo.manager.connection.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const plant = await queryRunner.manager.findOne(UserPlant, {
        where: { id: plantId, userId },
        relations: ['seedItem'],
      });

      if (!plant) {
        throw new NotFoundException('Plant not found');
      }

      // Check if plant is ready to harvest (production_time passed)
      const growthTime = plant.seedItem.productionTime || 0;
      const plantedTime = new Date(plant.plantedAt).getTime();
      const currentTime = Date.now();
      
      if (currentTime - plantedTime < growthTime * 1000) {
        throw new BadRequestException('Plant is not ready to harvest');
      }

      // Add harvested item to inventory
      let inventory = await queryRunner.manager.findOne(UserInventory, {
        where: { userId, itemId: plant.seedItem.id },
      });

      if (inventory) {
        inventory.quantity += 1;
      } else {
        inventory = queryRunner.manager.create(UserInventory, {
          userId,
          itemId: plant.seedItem.id,
          quantity: 1,
        });
      }

      await queryRunner.manager.save(inventory);

      // Remove plant
      await queryRunner.manager.remove(plant);

      await queryRunner.commitTransaction();

      // Get updated inventory
      const updatedInventory = await this.getInventory(userId);

      this.farmGateway.notifyPlantHarvested(userId, plantId, plant.seedItem);
      this.farmGateway.notifyInventoryUpdate(userId, updatedInventory);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Animals
  async getFarmAnimals(): Promise<FarmAnimal[]> {
    return this.farmAnimalsRepo.find();
  }

  async getUserAnimals(userId: string): Promise<UserFarmAnimal[]> {
    return this.userAnimalsRepo.find({
      where: { userId },
      relations: ['animal'],
    });
  }

  async addAnimal(userId: string, animalId: string): Promise<UserFarmAnimal> {
    const animal = this.userAnimalsRepo.create({
      userId,
      animalId,
      happiness: 100,
      lastFedAt: new Date(),
      lastCollectedAt: new Date(),
    });

    return this.userAnimalsRepo.save(animal);
  }

  async feedAnimal(userId: string, userAnimalId: string): Promise<UserFarmAnimal> {
    const userAnimal = await this.userAnimalsRepo.findOne({
      where: { id: userAnimalId, userId },
      relations: ['animal'],
    });

    if (!userAnimal) {
      throw new NotFoundException('Animal not found');
    }

    // Check if user has feed item
    if (userAnimal.animal.feedItemId) {
      await this.removeFromInventory(userId, userAnimal.animal.feedItemId, 1);
    }

    userAnimal.lastFedAt = new Date();
    userAnimal.happiness = Math.min(100, userAnimal.happiness + 20);

    const savedAnimal = await this.userAnimalsRepo.save(userAnimal);

    // Get updated inventory
    const inventory = await this.getInventory(userId);

    this.farmGateway.notifyAnimalUpdate(userId, savedAnimal);
    this.farmGateway.notifyInventoryUpdate(userId, inventory);
    
    return savedAnimal;
  }

  async collectFromAnimal(userId: string, userAnimalId: string): Promise<void> {
    const userAnimal = await this.userAnimalsRepo.findOne({
      where: { id: userAnimalId, userId },
      relations: ['animal'],
    });

    if (!userAnimal) {
      throw new NotFoundException('Animal not found');
    }

    // Check if production is ready
    const productionTime = userAnimal.animal.productionTime;
    const lastCollected = new Date(userAnimal.lastCollectedAt).getTime();
    const currentTime = Date.now();

    if (currentTime - lastCollected < productionTime * 1000) {
      throw new BadRequestException('Production not ready yet');
    }

    // Add product to inventory
    await this.addToInventory(userId, userAnimal.animal.productionItemId, 1);

    // Get updated inventory
    const inventory = await this.getInventory(userId);

    this.farmGateway.notifyAnimalCollected(userId, userAnimalId, userAnimal.animal);
    this.farmGateway.notifyInventoryUpdate(userId, inventory);

    userAnimal.lastCollectedAt = new Date();
    await this.userAnimalsRepo.save(userAnimal);
  }

  // Production
  async getProductionChains(zoneId?: string): Promise<ProductionChain[]> {
    const where = zoneId ? { zoneId } : {};
    return this.productionChainsRepo.find({
      where,
      relations: ['ingredients'],
    });
  }

  async getUserProductions(userId: string, zoneId: string): Promise<UserProduction[]> {
    return this.userProductionsRepo.find({
      where: { userId, zoneId },
      relations: ['chain'],
    });
  }

  async startProduction(userId: string, startProductionDto: StartProductionDto): Promise<UserProduction> {
    const queryRunner = this.productionChainsRepo.manager.connection.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const chain = await queryRunner.manager.findOne(ProductionChain, {
        where: { id: startProductionDto.chainId },
        relations: ['ingredients', 'ingredients.item'],
      });

      if (!chain) {
        throw new NotFoundException('Production chain not found');
      }

      // Check if user has all required ingredients
      for (const ingredient of chain.ingredients) {
        const inventory = await queryRunner.manager.findOne(UserInventory, {
          where: { userId, itemId: ingredient.itemId },
        });

        if (!inventory || inventory.quantity < ingredient.quantityNeeded) {
          throw new BadRequestException(
            `Insufficient ${ingredient.item.name} in inventory`,
          );
        }
      }

      // Remove ingredients from inventory
      for (const ingredient of chain.ingredients) {
        const inventory = await queryRunner.manager.findOne(UserInventory, {
          where: { userId, itemId: ingredient.itemId },
        });
        
        inventory.quantity -= ingredient.quantityNeeded;
        
        if (inventory.quantity === 0) {
          await queryRunner.manager.remove(inventory);
        } else {
          await queryRunner.manager.save(inventory);
        }
      }

      // Calculate finish time
      const startedAt = new Date();
      const finishAt = new Date(startedAt.getTime() + chain.baseTime * 60 * 1000);

      // Create production
      const production = queryRunner.manager.create(UserProduction, {
        userId,
        chainId: startProductionDto.chainId,
        zoneId: startProductionDto.zoneId,
        slotIndex: startProductionDto.slotIndex,
        startedAt,
        finishAt,
      });

      const savedProduction = await queryRunner.manager.save(production);

      await queryRunner.commitTransaction();

      // Get updated inventory
      const inventory = await this.getInventory(userId);

      // Notify via WebSocket
      this.farmGateway.notifyProductionStarted(userId, savedProduction);
      this.farmGateway.notifyInventoryUpdate(userId, inventory);

      return savedProduction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async collectProduction(userId: string, productionId: string): Promise<void> {
    const production = await this.userProductionsRepo.findOne({
      where: { id: productionId, userId },
      relations: ['chain', 'chain.outputItem'],
    });

    if (!production) {
      throw new NotFoundException('Production not found');
    }

    // Check if production is finished
    if (new Date() < production.finishAt) {
      throw new BadRequestException('Production not finished yet');
    }

    // Add output to inventory
    await this.addToInventory(
      userId,
      production.chain.outputItemId,
      production.chain.outputQuantity,
    );

    // Get updated inventory
    const inventory = await this.getInventory(userId);

    this.farmGateway.notifyProductionCompleted(userId, productionId, production.chain.outputItem);
    this.farmGateway.notifyInventoryUpdate(userId, inventory);

    // Remove production
    await this.userProductionsRepo.remove(production);
  }

  // Items
  async getFarmItems(): Promise<FarmItem[]> {
    return this.farmItemsRepo.find();
  }

  // Boosters
  async getZoneBoosters(zoneId: string): Promise<ZoneBooster[]> {
    return this.zoneBoostersRepo.find({ where: { zoneId } });
  }

  async getUserActiveBoosters(userId: string): Promise<UserActiveBooster[]> {
    return this.userActiveBoostersRepo.find({
      where: { userId },
      relations: ['booster'],
    });
  }

  async activateBooster(userId: string, boosterId: string): Promise<UserActiveBooster> {
    const booster = await this.zoneBoostersRepo.findOne({ where: { id: boosterId } });
    if (!booster) {
      throw new NotFoundException('Booster not found');
    }

    // Check cooldown
    const existing = await this.userActiveBoostersRepo.findOne({
      where: { userId, boosterId },
    });
    if (existing && new Date(existing.canActivateAgainAt) > new Date()) {
      throw new BadRequestException('Booster is on cooldown');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + booster.duration * 1000);
    const canActivateAgainAt = new Date(now.getTime() + booster.cooldown * 1000);

    if (existing) {
      existing.activatedAt = now;
      existing.expiresAt = expiresAt;
      existing.canActivateAgainAt = canActivateAgainAt;
      return this.userActiveBoostersRepo.save(existing);
    }

    const activeBooster = this.userActiveBoostersRepo.create({
      userId,
      boosterId,
      activatedAt: now,
      expiresAt,
      canActivateAgainAt,
    });

    return this.userActiveBoostersRepo.save(activeBooster);
  }
}

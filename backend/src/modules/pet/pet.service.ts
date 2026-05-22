import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from './entities/pet.entity';
import { PetShopItem } from './entities/pet-shop-item.entity';
import { UserPetItem } from './entities/user-pet-item.entity';
import { CreatePetDto } from './dto/create-pet.dto';
import { UseItemDto } from './dto/use-item.dto';
import { PetGateway } from './pet.gateway';

@Injectable()
export class PetService {
  constructor(
    @InjectRepository(Pet)
    private petsRepo: Repository<Pet>,
    @InjectRepository(PetShopItem)
    private shopItemsRepo: Repository<PetShopItem>,
    @InjectRepository(UserPetItem)
    private userItemsRepo: Repository<UserPetItem>,
    @Inject(forwardRef(() => PetGateway))
    private petGateway: PetGateway,
  ) {}

  async getUserPet(userId: string): Promise<Pet | null> {
    const pet = await this.petsRepo.findOne({
      where: { userId, ranAwayAt: null as any },
    });

    if (pet) {
      // Update stats based on time passed
      await this.updatePetStats(pet);
      // Pet may have run away during updatePetStats
      if (pet.ranAwayAt) {
        return null;
      }
    }

    return pet;
  }

  async createPet(userId: string, createPetDto: CreatePetDto): Promise<Pet> {
    console.log('[PetService] createPet called:', { userId, createPetDto });
    
    // Check if user already has an active (non-runaway) pet
    const existingPet = await this.getUserPet(userId);
    console.log('[PetService] Existing pet check:', existingPet ? `exists (ranAwayAt: ${existingPet.ranAwayAt})` : 'not found');
    // getUserPet may return a pet that just ran away during updatePetStats,
    // so we need to double-check ranAwayAt
    if (existingPet && !existingPet.ranAwayAt) {
      console.log('[PetService] User already has an active pet, throwing BadRequestException');
      throw new BadRequestException('User already has a pet');
    }

    const pet = this.petsRepo.create({
      userId,
      ...createPetDto,
      hunger: 100,
      thirst: 100,
      happiness: 100,
      lastFedAt: new Date(),
      lastWateredAt: new Date(),
      lastPlayedAt: new Date(),
    });

    const savedPet = await this.petsRepo.save(pet);
    this.petGateway.notifyPetCreated(userId, savedPet);
    
    return savedPet;
  }

  async feedPet(userId: string): Promise<Pet> {
    const pet = await this.getPetForAction(userId);

    pet.hunger = Math.min(100, pet.hunger + 30);
    pet.lastFedAt = new Date();

    const savedPet = await this.petsRepo.save(pet);
    this.petGateway.notifyPetFed(userId, savedPet);
    
    return savedPet;
  }

  async waterPet(userId: string): Promise<Pet> {
    const pet = await this.getPetForAction(userId);

    pet.thirst = Math.min(100, pet.thirst + 30);
    pet.lastWateredAt = new Date();

    const savedPet = await this.petsRepo.save(pet);
    this.petGateway.notifyPetWatered(userId, savedPet);
    
    return savedPet;
  }

  async playWithPet(userId: string): Promise<Pet> {
    const pet = await this.getPetForAction(userId);

    pet.happiness = Math.min(100, pet.happiness + 20);
    pet.lastPlayedAt = new Date();

    const savedPet = await this.petsRepo.save(pet);
    this.petGateway.notifyPetPlayed(userId, savedPet);
    
    return savedPet;
  }

  async useItemOnPet(userId: string, useItemDto: UseItemDto): Promise<Pet> {
    const pet = await this.getPetForAction(userId);

    // Check if user has the item
    const userItem = await this.userItemsRepo.findOne({
      where: { userId, itemId: useItemDto.itemId },
      relations: ['item'],
    });

    if (!userItem || userItem.quantity < 1) {
      throw new BadRequestException('Item not found in inventory');
    }

    // Apply item effects
    pet.hunger = Math.min(100, pet.hunger + userItem.item.statEffectHunger);
    pet.thirst = Math.min(100, pet.thirst + userItem.item.statEffectThirst);
    pet.happiness = Math.min(100, pet.happiness + userItem.item.statEffectHappiness);

    // Remove item if consumable
    if (userItem.item.isConsumable) {
      userItem.quantity -= 1;
      if (userItem.quantity <= 0) {
        await this.userItemsRepo.remove(userItem);
      } else {
        await this.userItemsRepo.save(userItem);
      }
    }

    const savedPet = await this.petsRepo.save(pet);
    this.petGateway.notifyPetItemUsed(userId, savedPet, userItem.item);
    
    return savedPet;
  }

  async getShopItems(): Promise<PetShopItem[]> {
    return this.shopItemsRepo.find();
  }

  async getUserItems(userId: string): Promise<UserPetItem[]> {
    return this.userItemsRepo.find({
      where: { userId },
      relations: ['item'],
    });
  }

  private async getPetForAction(userId: string): Promise<Pet> {
    const pet = await this.petsRepo.findOne({
      where: { userId, ranAwayAt: null as any },
    });
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }
    return pet;
  }

  private async updatePetStats(pet: Pet): Promise<void> {
    const now = Date.now();
    const hourInMs = 3600000;

    // Calculate stats based on time since last interaction
    // Use stored values as the "base" set at last interaction time
    const hoursSinceFed = Math.floor(
      (now - new Date(pet.lastFedAt).getTime()) / hourInMs,
    );
    const hoursSinceWatered = Math.floor(
      (now - new Date(pet.lastWateredAt).getTime()) / hourInMs,
    );
    const hoursSincePlayed = Math.floor(
      (now - new Date(pet.lastPlayedAt).getTime()) / hourInMs,
    );

    // Calculate display stats without modifying stored values
    const currentHunger = Math.max(0, pet.hunger - hoursSinceFed);
    const currentThirst = Math.max(0, pet.thirst - hoursSinceWatered);
    const currentHappiness = Math.max(0, pet.happiness - hoursSincePlayed);

    // Check if pet should run away
    const dayInMs = 86400000;
    const maxLastInteraction = Math.max(
      new Date(pet.lastFedAt).getTime(),
      new Date(pet.lastWateredAt).getTime(),
      new Date(pet.lastPlayedAt).getTime(),
    );

    if (
      currentHunger <= 0 ||
      currentThirst <= 0 ||
      currentHappiness <= 0 ||
      now - maxLastInteraction > 14 * dayInMs
    ) {
      // Only save to DB when pet actually runs away
      pet.hunger = currentHunger;
      pet.thirst = currentThirst;
      pet.happiness = currentHappiness;
      pet.ranAwayAt = new Date();
      await this.petsRepo.save(pet);
      this.petGateway.notifyPetRanAway(pet.userId, pet.id);
    } else {
      // Set calculated values on the entity for the response,
      // but do NOT save to DB — keeps base values intact
      pet.hunger = currentHunger;
      pet.thirst = currentThirst;
      pet.happiness = currentHappiness;
    }
  }
}

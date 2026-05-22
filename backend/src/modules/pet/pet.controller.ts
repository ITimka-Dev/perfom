import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PetService } from './pet.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePetDto } from './dto/create-pet.dto';
import { UseItemDto } from './dto/use-item.dto';

@ApiTags('pet')
@Controller('pet')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Get()
  @ApiOperation({ summary: 'Get user pet' })
  getUserPet(@CurrentUser('id') userId: string) {
    return this.petService.getUserPet(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new pet' })
  createPet(
    @CurrentUser('id') userId: string,
    @Body() createPetDto: CreatePetDto,
  ) {
    console.log('[PetController] createPet called:', { userId, createPetDto });
    return this.petService.createPet(userId, createPetDto);
  }

  @Post('feed')
  @ApiOperation({ summary: 'Feed the pet' })
  feedPet(@CurrentUser('id') userId: string) {
    return this.petService.feedPet(userId);
  }

  @Post('water')
  @ApiOperation({ summary: 'Give water to pet' })
  waterPet(@CurrentUser('id') userId: string) {
    return this.petService.waterPet(userId);
  }

  @Post('play')
  @ApiOperation({ summary: 'Play with pet' })
  playWithPet(@CurrentUser('id') userId: string) {
    return this.petService.playWithPet(userId);
  }

  @Post('use-item')
  @ApiOperation({ summary: 'Use an item on pet' })
  useItemOnPet(
    @CurrentUser('id') userId: string,
    @Body() useItemDto: UseItemDto,
  ) {
    return this.petService.useItemOnPet(userId, useItemDto);
  }

  @Get('shop')
  @ApiOperation({ summary: 'Get pet shop items' })
  getShopItems() {
    return this.petService.getShopItems();
  }

  @Get('items')
  @ApiOperation({ summary: 'Get user pet items' })
  getUserItems(@CurrentUser('id') userId: string) {
    return this.petService.getUserItems(userId);
  }
}

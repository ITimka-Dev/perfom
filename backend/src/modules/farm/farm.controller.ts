import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FarmService } from './farm.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PlantSeedDto } from './dto/plant-seed.dto';
import { StartProductionDto } from './dto/start-production.dto';

@ApiTags('farm')
@Controller('farm')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class FarmController {
  constructor(private readonly farmService: FarmService) {}

  // Inventory
  @Get('inventory')
  @ApiOperation({ summary: 'Get user inventory' })
  getInventory(@CurrentUser('id') userId: string) {
    return this.farmService.getInventory(userId);
  }

  // Items
  @Get('items')
  @ApiOperation({ summary: 'Get all farm items' })
  getFarmItems() {
    return this.farmService.getFarmItems();
  }

  // Plants
  @Get('plants')
  @ApiOperation({ summary: 'Get user plants in a zone' })
  getUserPlants(
    @CurrentUser('id') userId: string,
    @Query('zoneId') zoneId: string,
  ) {
    return this.farmService.getUserPlants(userId, zoneId);
  }

  @Post('plants')
  @ApiOperation({ summary: 'Plant a seed' })
  plantSeed(
    @CurrentUser('id') userId: string,
    @Body() plantSeedDto: PlantSeedDto,
  ) {
    return this.farmService.plantSeed(userId, plantSeedDto);
  }

  @Post('plants/:id/water')
  @ApiOperation({ summary: 'Water a plant' })
  waterPlant(@CurrentUser('id') userId: string, @Param('id') plantId: string) {
    return this.farmService.waterPlant(userId, plantId);
  }

  @Post('plants/:id/harvest')
  @ApiOperation({ summary: 'Harvest a plant' })
  harvestPlant(
    @CurrentUser('id') userId: string,
    @Param('id') plantId: string,
  ) {
    return this.farmService.harvestPlant(userId, plantId);
  }

  // Animals
  @Get('animals')
  @ApiOperation({ summary: 'Get all available farm animals' })
  getFarmAnimals() {
    return this.farmService.getFarmAnimals();
  }

  @Get('animals/user')
  @ApiOperation({ summary: 'Get user animals' })
  getUserAnimals(@CurrentUser('id') userId: string) {
    return this.farmService.getUserAnimals(userId);
  }

  @Post('animals/:animalId')
  @ApiOperation({ summary: 'Add an animal' })
  addAnimal(
    @CurrentUser('id') userId: string,
    @Param('animalId') animalId: string,
  ) {
    return this.farmService.addAnimal(userId, animalId);
  }

  @Post('animals/user/:id/feed')
  @ApiOperation({ summary: 'Feed an animal' })
  feedAnimal(
    @CurrentUser('id') userId: string,
    @Param('id') userAnimalId: string,
  ) {
    return this.farmService.feedAnimal(userId, userAnimalId);
  }

  @Post('animals/user/:id/collect')
  @ApiOperation({ summary: 'Collect production from animal' })
  collectFromAnimal(
    @CurrentUser('id') userId: string,
    @Param('id') userAnimalId: string,
  ) {
    return this.farmService.collectFromAnimal(userId, userAnimalId);
  }

  // Production
  @Get('production/chains')
  @ApiOperation({ summary: 'Get production chains' })
  getProductionChains(@Query('zoneId') zoneId?: string) {
    return this.farmService.getProductionChains(zoneId);
  }

  @Get('production/user')
  @ApiOperation({ summary: 'Get user productions' })
  getUserProductions(
    @CurrentUser('id') userId: string,
    @Query('zoneId') zoneId: string,
  ) {
    return this.farmService.getUserProductions(userId, zoneId);
  }

  @Post('production')
  @ApiOperation({ summary: 'Start production' })
  startProduction(
    @CurrentUser('id') userId: string,
    @Body() startProductionDto: StartProductionDto,
  ) {
    return this.farmService.startProduction(userId, startProductionDto);
  }

  @Post('production/:id/collect')
  @ApiOperation({ summary: 'Collect finished production' })
  collectProduction(
    @CurrentUser('id') userId: string,
    @Param('id') productionId: string,
  ) {
    return this.farmService.collectProduction(userId, productionId);
  }

  // Boosters
  @Get('boosters')
  @ApiOperation({ summary: 'Get zone boosters' })
  getZoneBoosters(@Query('zoneId') zoneId: string) {
    return this.farmService.getZoneBoosters(zoneId);
  }

  @Get('boosters/active')
  @ApiOperation({ summary: 'Get user active boosters' })
  getUserActiveBoosters(@CurrentUser('id') userId: string) {
    return this.farmService.getUserActiveBoosters(userId);
  }

  @Post('boosters/:boosterId/activate')
  @ApiOperation({ summary: 'Activate a booster' })
  activateBooster(
    @CurrentUser('id') userId: string,
    @Param('boosterId') boosterId: string,
  ) {
    return this.farmService.activateBooster(userId, boosterId);
  }
}

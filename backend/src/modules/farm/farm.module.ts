import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmService } from './farm.service';
import { FarmController } from './farm.controller';
import { FarmGateway } from './farm.gateway';
import { FarmItem } from './entities/farm-item.entity';
import { UserInventory } from './entities/user-inventory.entity';
import { UserPlant } from './entities/user-plant.entity';
import { FarmAnimal } from './entities/farm-animal.entity';
import { UserFarmAnimal } from './entities/user-farm-animal.entity';
import { ProductionChain } from './entities/production-chain.entity';
import { ProductionChainIngredient } from './entities/production-chain-ingredient.entity';
import { UserProduction } from './entities/user-production.entity';
import { ZoneBooster } from './entities/zone-booster.entity';
import { UserActiveBooster } from './entities/user-active-booster.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      FarmItem,
      UserInventory,
      UserPlant,
      FarmAnimal,
      UserFarmAnimal,
      ProductionChain,
      ProductionChainIngredient,
      UserProduction,
      ZoneBooster,
      UserActiveBooster,
    ]),
  ],
  controllers: [FarmController],
  providers: [FarmService, FarmGateway],
  exports: [FarmService, FarmGateway],
})
export class FarmModule {}

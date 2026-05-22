import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetService } from './pet.service';
import { PetController } from './pet.controller';
import { PetGateway } from './pet.gateway';
import { Pet } from './entities/pet.entity';
import { PetShopItem } from './entities/pet-shop-item.entity';
import { UserPetItem } from './entities/user-pet-item.entity';

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
    TypeOrmModule.forFeature([Pet, PetShopItem, UserPetItem]),
  ],
  controllers: [PetController],
  providers: [PetService, PetGateway],
  exports: [PetService, PetGateway],
})
export class PetModule {}

import { IsUUID, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PlantSeedDto {
  @ApiProperty({ description: 'Zone ID where to plant' })
  @IsUUID()
  zoneId: string;

  @ApiProperty({ description: 'Seed item ID to plant' })
  @IsUUID()
  seedItemId: string;

  @ApiProperty({ description: 'Slot index (0-9)', minimum: 0, maximum: 9 })
  @IsInt()
  @Min(0)
  @Max(9)
  slotIndex: number;
}

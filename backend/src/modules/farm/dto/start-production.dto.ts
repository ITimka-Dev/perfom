import { IsUUID, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartProductionDto {
  @ApiProperty({ description: 'Production chain ID' })
  @IsUUID()
  chainId: string;

  @ApiProperty({ description: 'Zone ID' })
  @IsUUID()
  zoneId: string;

  @ApiProperty({ description: 'Production slot index (0-4)', minimum: 0, maximum: 4 })
  @IsInt()
  @Min(0)
  @Max(4)
  slotIndex: number;
}

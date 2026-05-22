import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyticsFilterDto {
  @ApiProperty({ description: 'Zone ID filter', required: false })
  @IsOptional()
  @IsString()
  zoneId?: string;

  @ApiProperty({ description: 'Start date filter', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date filter', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

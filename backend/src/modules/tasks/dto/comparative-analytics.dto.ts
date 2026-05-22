import { IsArray, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ComparativeAnalyticsDto {
  @ApiProperty({ description: 'Zone IDs to compare', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  zoneIds?: string[];

  @ApiProperty({ description: 'Start date for first period', required: false })
  @IsOptional()
  @IsDateString()
  startDate1?: string;

  @ApiProperty({ description: 'End date for first period', required: false })
  @IsOptional()
  @IsDateString()
  endDate1?: string;

  @ApiProperty({ description: 'Start date for second period', required: false })
  @IsOptional()
  @IsDateString()
  startDate2?: string;

  @ApiProperty({ description: 'End date for second period', required: false })
  @IsOptional()
  @IsDateString()
  endDate2?: string;
}

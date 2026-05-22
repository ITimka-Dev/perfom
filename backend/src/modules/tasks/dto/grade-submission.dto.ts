import { IsInt, IsString, IsOptional, IsEnum, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GradeSubmissionDto {
  @ApiProperty({ description: 'Grade (0-100)', minimum: 0, maximum: 100, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  grade?: number;

  @ApiProperty({ description: 'Teacher feedback', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string;

  @ApiProperty({ description: 'Status of submission', required: false, enum: ['reviewed', 'rejected'] })
  @IsOptional()
  @IsEnum(['reviewed', 'rejected'])
  status?: 'reviewed' | 'rejected';
}


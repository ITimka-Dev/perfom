import { IsString, IsUUID, IsInt, IsArray, IsOptional, Min, Max, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ description: 'Task title' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Task description', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'Task instructions', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  instructions?: string;

  @ApiProperty({ description: 'Zone ID' })
  @IsUUID()
  zoneId: string;

  @ApiProperty({ description: 'Difficulty level (1-5)', required: false, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiProperty({ description: 'Experience reward', required: false, default: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  experienceReward?: number;

  @ApiProperty({ description: 'Required level to access', required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  requiredLevel?: number;

  @ApiProperty({ description: 'Target grades (e.g. [80, 90, 100])', required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  targetGrades?: number[];

  @ApiProperty({ description: 'Attachment URLs', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];
}

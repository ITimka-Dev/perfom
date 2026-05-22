import { IsString, IsIn, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePetDto {
  @ApiProperty({ description: 'Pet name', minLength: 1, maxLength: 20 })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  name: string;

  @ApiProperty({ description: 'Pet type', enum: ['cow', 'chicken', 'sheep'] })
  @IsString()
  @IsIn(['cow', 'chicken', 'sheep'])
  type: 'cow' | 'chicken' | 'sheep';
}

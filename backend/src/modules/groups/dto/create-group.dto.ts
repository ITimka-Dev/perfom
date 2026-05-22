import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({ example: 'Группа 10А' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Класс математики', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ['student-uuid-1', 'student-uuid-2'], required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  studentIds?: string[];
}

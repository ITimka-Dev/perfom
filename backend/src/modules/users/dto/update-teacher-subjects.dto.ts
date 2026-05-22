import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class UpdateTeacherSubjectsDto {
  @ApiProperty({ 
    description: 'Array of zone IDs that the teacher teaches',
    example: ['zone-id-1', 'zone-id-2']
  })
  @IsArray()
  @IsUUID('4', { each: true })
  zoneIds: string[];
}

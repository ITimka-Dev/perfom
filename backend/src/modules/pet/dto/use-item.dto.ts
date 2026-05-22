import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UseItemDto {
  @ApiProperty()
  @IsUUID()
  itemId: string;
}

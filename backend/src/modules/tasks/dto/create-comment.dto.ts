import { IsString, IsNotEmpty, MaxLength, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment text' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  commentText: string;

  @ApiProperty({ description: 'Attached file URLs', required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fileUrls?: string[];
}

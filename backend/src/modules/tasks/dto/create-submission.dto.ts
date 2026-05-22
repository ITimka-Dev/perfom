import { IsString, IsArray, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubmissionDto {
  @ApiProperty({ description: 'Submission content/answer' })
  @IsString()
  @MaxLength(10000)
  content: string;

  @ApiProperty({ description: 'Attachment URLs', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];
}

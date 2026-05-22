import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AiService } from './ai.service';

class ChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  query!: string;

  @IsOptional()
  @IsString()
  subject?: string;
}

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('health')
  @ApiOperation({ summary: 'RAG service health' })
  health() {
    return this.aiService.health();
  }

  @Get('stats')
  @ApiOperation({ summary: 'RAG vector DB stats' })
  stats() {
    return this.aiService.stats();
  }

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chat with RAG-powered TIMMY assistant' })
  chat(@Body() dto: ChatDto, @CurrentUser() user: { id: string }) {
    return this.aiService.chat({
      query: dto.query,
      subject: dto.subject,
      user_id: user?.id,
    });
  }
}

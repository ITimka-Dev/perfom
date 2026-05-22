import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProgressService } from './progress.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('progress')
@Controller('progress')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('user')
  @ApiOperation({ summary: 'Get current user progress in all zones' })
  getUserProgress(@CurrentUser('id') userId: string) {
    return this.progressService.getUserProgress(userId);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get leaderboard with optional filters' })
  getLeaderboard(
    @Query('zoneId') zoneId?: string,
    @Query('sortBy') sortBy?: 'score' | 'achievements' | 'avgGrade',
  ) {
    return this.progressService.getLeaderboard(zoneId, sortBy);
  }

  @Get(':zoneId')
  @ApiOperation({ summary: 'Get user progress in specific zone' })
  getZoneProgress(
    @CurrentUser('id') userId: string,
    @Param('zoneId') zoneId: string,
  ) {
    return this.progressService.getZoneProgress(userId, zoneId);
  }
}

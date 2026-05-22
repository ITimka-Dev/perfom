import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AchievementsService } from './achievements.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('achievements')
@Controller('achievements')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all achievements' })
  getAllAchievements() {
    return this.achievementsService.getAllAchievements();
  }

  @Get('user')
  @ApiOperation({ summary: 'Get user achievements' })
  getUserAchievements(@CurrentUser('id') userId: string) {
    return this.achievementsService.getUserAchievements(userId);
  }

  @Get('user/progress')
  @ApiOperation({ summary: 'Get user achievement progress' })
  getUserProgress(@CurrentUser('id') userId: string) {
    return this.achievementsService.getUserAchievementProgress(userId);
  }

  @Post(':achievementId/unlock')
  @ApiOperation({ summary: 'Unlock an achievement' })
  unlockAchievement(
    @CurrentUser('id') userId: string,
    @Param('achievementId') achievementId: string,
  ) {
    return this.achievementsService.unlockAchievement(userId, achievementId);
  }
}

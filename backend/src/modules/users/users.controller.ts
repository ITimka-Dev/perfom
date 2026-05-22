import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateTeacherSubjectsDto } from './dto/update-teacher-subjects.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { StudentFilterDto, SubmissionFilterDto } from './dto/pagination.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get('teacher/subjects')
  @ApiOperation({ summary: 'Get teacher subjects' })
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async getTeacherSubjects(@CurrentUser('id') userId: string) {
    return this.usersService.getTeacherSubjects(userId);
  }

  @Put('teacher/subjects')
  @ApiOperation({ summary: 'Update teacher subjects' })
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async updateTeacherSubjects(
    @CurrentUser('id') userId: string,
    @Body() updateTeacherSubjectsDto: UpdateTeacherSubjectsDto,
  ) {
    return this.usersService.updateTeacherSubjects(userId, updateTeacherSubjectsDto);
  }

  @Get('teacher/stats')
  @ApiOperation({ summary: 'Get teacher statistics' })
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60) // Cache for 60 seconds
  async getTeacherStats(@CurrentUser('id') userId: string) {
    return this.usersService.getTeacherStats(userId);
  }

  @Get('teacher/students')
  @ApiOperation({ summary: 'Get students list for teacher' })
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30) // Cache for 30 seconds
  async getStudentsList(
    @CurrentUser('id') userId: string,
    @Query() filters: StudentFilterDto,
  ) {
    return this.usersService.getStudentsList(userId, filters);
  }

  @Get('teacher/submissions')
  @ApiOperation({ summary: 'Get submissions for teacher to review' })
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30) // Cache for 30 seconds
  async getSubmissionsByTeacher(
    @CurrentUser('id') userId: string,
    @Query() filters: SubmissionFilterDto,
  ) {
    return this.usersService.getSubmissionsByTeacher(userId, filters);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('groups')
@Controller('groups')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new group' })
  createGroup(
    @CurrentUser('id') teacherId: string,
    @Body() createGroupDto: CreateGroupDto,
  ) {
    return this.groupsService.createGroup(teacherId, createGroupDto);
  }

  @Get()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all groups for teacher' })
  getGroups(@CurrentUser('id') teacherId: string) {
    return this.groupsService.getTeacherGroups(teacherId);
  }

  @Get(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get group by ID with members and tasks' })
  getGroup(@Param('id') groupId: string, @CurrentUser('id') userId: string) {
    return this.groupsService.getGroupById(groupId, userId);
  }

  @Put(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update group' })
  updateGroup(
    @Param('id') groupId: string,
    @CurrentUser('id') teacherId: string,
    @Body() updateDto: Partial<CreateGroupDto>,
  ) {
    return this.groupsService.updateGroup(groupId, teacherId, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete group' })
  deleteGroup(@Param('id') groupId: string, @CurrentUser('id') teacherId: string) {
    return this.groupsService.deleteGroup(groupId, teacherId);
  }

  @Post(':id/members')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add students to group' })
  addMembers(
    @Param('id') groupId: string,
    @CurrentUser('id') teacherId: string,
    @Body() body: { studentIds: string[] },
  ) {
    return this.groupsService.addStudentsToGroup(groupId, body.studentIds, teacherId);
  }

  @Delete(':id/members/:studentId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove student from group' })
  removeMember(
    @Param('id') groupId: string,
    @Param('studentId') studentId: string,
    @CurrentUser('id') teacherId: string,
  ) {
    return this.groupsService.removeStudentFromGroup(groupId, studentId, teacherId);
  }

  @Post(':id/tasks')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign task to group' })
  assignTask(
    @Param('id') groupId: string,
    @CurrentUser('id') teacherId: string,
    @Body() assignTaskDto: AssignTaskDto,
  ) {
    return this.groupsService.assignTaskToGroup(groupId, assignTaskDto, teacherId);
  }

  @Get(':id/stats')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get group statistics' })
  getGroupStats(@Param('id') groupId: string, @CurrentUser('id') teacherId: string) {
    return this.groupsService.getGroupStats(groupId, teacherId);
  }
}

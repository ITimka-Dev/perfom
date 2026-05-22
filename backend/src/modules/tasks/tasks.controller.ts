import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new task (teachers only)' })
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.tasksService.create(createTaskDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update task' })
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.tasksService.update(id, updateTaskDto, userId, userRole);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete task' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.tasksService.remove(id, userId, userRole);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit task solution' })
  submitTask(
    @Param('id') taskId: string,
    @CurrentUser('id') userId: string,
    @Body() createSubmissionDto: CreateSubmissionDto,
  ) {
    return this.tasksService.submitTask(taskId, userId, createSubmissionDto);
  }

  @Get('user/submissions')
  @ApiOperation({ summary: 'Get current user submissions' })
  getUserSubmissions(@CurrentUser('id') userId: string) {
    return this.tasksService.getUserSubmissions(userId);
  }

  @Get(':id/submissions')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all submissions for a task' })
  getSubmissions(@Param('id') taskId: string) {
    return this.tasksService.getSubmissions(taskId);
  }

  @Get('submissions/:id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get submission by ID' })
  getSubmissionById(@Param('id') submissionId: string) {
    return this.tasksService.getSubmissionById(submissionId);
  }

  @Patch('submissions/:id/grade')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Grade a submission' })
  gradeSubmission(
    @Param('id') submissionId: string,
    @Body() gradeSubmissionDto: GradeSubmissionDto,
    @CurrentUser('id') reviewerId: string,
  ) {
    return this.tasksService.gradeSubmission(
      submissionId,
      gradeSubmissionDto,
      reviewerId,
    );
  }

  // Submission Comments
  @Post('submissions/:id/comments')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add comment to submission' })
  createComment(
    @Param('id') submissionId: string,
    @CurrentUser('id') teacherId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.tasksService.createComment(submissionId, teacherId, createCommentDto);
  }

  @Get('submissions/:id/comments')
  @ApiOperation({ summary: 'Get all comments for a submission' })
  getCommentsBySubmission(@Param('id') submissionId: string) {
    return this.tasksService.getCommentsBySubmission(submissionId);
  }

  @Patch('comments/:id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update comment' })
  updateComment(
    @Param('id') commentId: string,
    @CurrentUser('id') teacherId: string,
    @Body() body: { commentText: string },
  ) {
    return this.tasksService.updateComment(commentId, teacherId, body.commentText);
  }

  @Delete('comments/:id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete comment' })
  deleteComment(
    @Param('id') commentId: string,
    @CurrentUser('id') teacherId: string,
  ) {
    return this.tasksService.deleteComment(commentId, teacherId);
  }

  // Comment Templates
  @Post('templates')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create comment template' })
  createTemplate(
    @CurrentUser('id') teacherId: string,
    @Body() createTemplateDto: CreateTemplateDto,
  ) {
    return this.tasksService.createTemplate(teacherId, createTemplateDto);
  }

  @Get('templates')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all templates for current teacher' })
  getTemplatesByTeacher(@CurrentUser('id') teacherId: string) {
    return this.tasksService.getTemplatesByTeacher(teacherId);
  }

  @Patch('templates/:id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update template' })
  updateTemplate(
    @Param('id') templateId: string,
    @CurrentUser('id') teacherId: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return this.tasksService.updateTemplate(templateId, teacherId, updateTemplateDto);
  }

  @Delete('templates/:id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete template' })
  deleteTemplate(
    @Param('id') templateId: string,
    @CurrentUser('id') teacherId: string,
  ) {
    return this.tasksService.deleteTemplate(templateId, teacherId);
  }

  @Get('analytics/comparative')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get comparative analytics between zones and periods' })
  getComparativeAnalytics(@Query() query: any) {
    return this.tasksService.getComparativeAnalytics(query);
  }
}

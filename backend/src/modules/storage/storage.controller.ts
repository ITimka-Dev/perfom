import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StorageService } from './storage.service';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@ApiTags('storage')
@ApiBearerAuth()
@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('task/:taskId/upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadTaskAttachment(
    @Param('taskId') taskId: string,
    @CurrentUser() user: { userId: string },
    @UploadedFile() file: UploadedFile,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const url = await this.storageService.uploadTaskAttachment(
      user.userId,
      taskId,
      file,
    );

    return { url };
  }

  @Post('submission/:submissionId/upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadCommentAttachment(
    @Param('submissionId') submissionId: string,
    @CurrentUser() user: { userId: string },
    @UploadedFile() file: UploadedFile,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const url = await this.storageService.uploadCommentAttachment(
      user.userId,
      submissionId,
      file,
    );

    return { url };
  }
}

import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs/promises';
import * as path from 'path';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly uploadsDir: string;
  private readonly storageType: string;
  private s3Client: S3Client | null = null;
  private readonly s3Bucket: string;

  constructor(private configService: ConfigService) {
    this.storageType = this.configService.get<string>('STORAGE_TYPE', 'local');
    this.uploadsDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    this.s3Bucket = this.configService.get<string>('S3_BUCKET', 'comment-attachments');

    if (this.storageType === 's3' || this.storageType === 'minio') {
      const endpoint = this.configService.get<string>('S3_ENDPOINT');
      const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY');
      const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY');

      if (!endpoint || !accessKeyId || !secretAccessKey) {
        throw new Error('S3/MinIO credentials not configured');
      }

      this.s3Client = new S3Client({
        endpoint,
        region: this.configService.get<string>('S3_REGION', 'us-east-1'),
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true, // Required for MinIO
      });
    }
  }

  async onModuleInit() {
    if (this.storageType === 'local') {
      await this.ensureUploadDir();
    } else if (this.s3Client) {
      await this.ensureS3Bucket();
    }
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  private async ensureS3Bucket() {
    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.s3Bucket })
      );
    } catch (error) {
      // Bucket doesn't exist, create it
      try {
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.s3Bucket })
        );
        console.log(`✅ S3/MinIO bucket created: ${this.s3Bucket}`);
      } catch (createError: unknown) {
        const message = createError instanceof Error ? createError.message : 'Unknown error';
        console.error(`Failed to create bucket: ${message}`);
      }
    }
  }

  async uploadFile(
    folder: string,
    filePath: string,
    file: UploadedFile,
  ): Promise<string> {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    if (this.storageType === 'local') {
      return this.uploadFileLocal(folder, filePath, file);
    } else {
      return this.uploadFileS3(folder, filePath, file);
    }
  }

  private async uploadFileLocal(
    folder: string,
    filePath: string,
    file: UploadedFile,
  ): Promise<string> {
    const fullPath = path.join(this.uploadsDir, folder, filePath);
    const dir = path.dirname(fullPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, file.buffer);

    return `/uploads/${folder}/${filePath}`;
  }

  private async uploadFileS3(
    folder: string,
    filePath: string,
    file: UploadedFile,
  ): Promise<string> {
    const key = `${folder}/${filePath}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
      })
    );

    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    return `${endpoint}/${this.s3Bucket}/${key}`;
  }

  async uploadTaskAttachment(
    userId: string,
    taskId: string,
    file: UploadedFile,
  ): Promise<string> {
    const timestamp = Date.now();
    const filename = `${userId}/${taskId}/${timestamp}-${file.originalname}`;
    return this.uploadFile('task-attachments', filename, file);
  }

  async uploadCommentAttachment(
    userId: string,
    submissionId: string,
    file: UploadedFile,
  ): Promise<string> {
    const timestamp = Date.now();
    const filename = `${userId}/${submissionId}/${timestamp}-${file.originalname}`;
    return this.uploadFile('comment-attachments', filename, file);
  }

  async deleteFile(folder: string, filePath: string): Promise<void> {
    if (this.storageType === 'local') {
      await this.deleteFileLocal(folder, filePath);
    } else {
      await this.deleteFileS3(folder, filePath);
    }
  }

  private async deleteFileLocal(folder: string, filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadsDir, folder, filePath);
    
    try {
      await fs.unlink(fullPath);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Delete failed: ${message}`);
    }
  }

  private async deleteFileS3(folder: string, filePath: string): Promise<void> {
    const key = `${folder}/${filePath}`;
    
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.s3Bucket,
          Key: key,
        })
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Delete failed: ${message}`);
    }
  }
}

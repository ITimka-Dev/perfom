import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class StudentFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  minLevel?: number;

  @IsOptional()
  @IsString()
  search?: string;
}

export class SubmissionFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsEnum(['pending', 'reviewed', 'rejected'])
  status?: 'pending' | 'reviewed' | 'rejected';

  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsString()
  studentId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

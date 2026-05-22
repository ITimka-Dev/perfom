import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthCheckResult } from './dto/health-check.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    type: HealthCheckResult,
  })
  @ApiResponse({
    status: 503,
    description: 'Service is unhealthy',
  })
  async check(): Promise<HealthCheckResult> {
    return this.healthService.checkHealth();
  }

  @Get('database')
  @ApiOperation({ summary: 'Database health check' })
  async checkDatabase() {
    return this.healthService.checkDatabase();
  }

  @Get('redis')
  @ApiOperation({ summary: 'Redis health check' })
  async checkRedis() {
    return this.healthService.checkRedis();
  }

  @Get('storage')
  @ApiOperation({ summary: 'Supabase Storage health check' })
  async checkStorage() {
    return this.healthService.checkStorage();
  }
}

import { Controller, Get, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { MonitoringService, Metrics } from './monitoring.service';
import { PrometheusService } from './prometheus.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly prometheusService: PrometheusService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Get application health status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Health status retrieved successfully',
    schema: {
      example: {
        status: 'healthy',
        checks: {
          memory: { status: 'ok', usage: '45.23%' },
          errors: { status: 'ok', count24h: 2 },
          uptime: { status: 'ok', seconds: 3600 }
        }
      }
    }
  })
  getHealth() {
    return this.monitoringService.getHealthStatus();
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed system metrics (Admin/Teacher only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Metrics retrieved successfully',
    schema: {
      example: {
        uptime: 3600,
        memoryUsage: {
          rss: 123456789,
          heapTotal: 98765432,
          heapUsed: 76543210,
          external: 1234567
        },
        errors: {
          total: 42,
          last24Hours: 5,
          recentErrors: []
        },
        requests: {
          totalProcessed: 1000,
          averageResponseTime: 125.5
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Teacher role required' })
  getMetrics(): Metrics {
    return this.monitoringService.getMetrics();
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get monitoring dashboard data (Admin/Teacher only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard data retrieved successfully',
    schema: {
      example: {
        health: {
          status: 'healthy',
          checks: {}
        },
        metrics: {
          uptime: 3600,
          memoryUsage: {},
          errors: {},
          requests: {}
        },
        timestamp: '2024-01-15T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Teacher role required' })
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin dashboard statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  getAdminStats() {
    return this.monitoringService.getAdminStats();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  @ApiResponse({ 
    status: 200, 
    description: 'Metrics in Prometheus format',
    content: {
      'text/plain': {
        schema: { type: 'string' }
      }
    }
  })
  async getPrometheusMetrics(@Res() res: Response) {
    const metrics = await this.prometheusService.getMetrics();
    res.set('Content-Type', this.prometheusService.getContentType());
    res.send(metrics);
  }
}

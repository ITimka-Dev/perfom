import { ApiProperty } from '@nestjs/swagger';

export class ServiceStatus {
  @ApiProperty({ enum: ['up', 'down'] })
  status: 'up' | 'down';

  @ApiProperty({ required: false })
  responseTime?: number;

  @ApiProperty({ required: false })
  error?: string;

  @ApiProperty({ required: false })
  details?: Record<string, any>;
}

export class HealthCheckResult {
  @ApiProperty({ enum: ['healthy', 'unhealthy'] })
  status: 'healthy' | 'unhealthy';

  @ApiProperty()
  timestamp: string;

  @ApiProperty()
  uptime: number;

  @ApiProperty()
  responseTime: number;

  @ApiProperty({
    type: 'object',
    properties: {
      database: { type: 'object' },
      redis: { type: 'object' },
      storage: { type: 'object' },
    },
  })
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    storage: ServiceStatus;
  };

  @ApiProperty()
  version: string;

  @ApiProperty()
  environment: string;
}

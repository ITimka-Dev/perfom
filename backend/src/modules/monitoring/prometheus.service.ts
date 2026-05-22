import { Injectable } from '@nestjs/common';
import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class PrometheusService {
  // HTTP Metrics
  public readonly httpRequestsTotal: Counter<string>;
  public readonly httpRequestDuration: Histogram<string>;
  
  // WebSocket Metrics
  public readonly websocketConnections: Gauge<string>;
  public readonly websocketMessagesTotal: Counter<string>;
  
  // Database Metrics
  public readonly databaseQueryDuration: Histogram<string>;
  public readonly databaseConnectionsActive: Gauge<string>;
  
  // Application Metrics
  public readonly errorsTotal: Counter<string>;
  public readonly tasksCompletedTotal: Counter<string>;
  public readonly submissionsTotal: Counter<string>;

  constructor() {
    // Collect default metrics (CPU, memory, etc.)
    collectDefaultMetrics({ register });

    // HTTP Metrics
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    // WebSocket Metrics
    this.websocketConnections = new Gauge({
      name: 'websocket_connections',
      help: 'Number of active WebSocket connections',
      labelNames: ['namespace'],
    });

    this.websocketMessagesTotal = new Counter({
      name: 'websocket_messages_total',
      help: 'Total number of WebSocket messages',
      labelNames: ['namespace', 'event'],
    });

    // Database Metrics
    this.databaseQueryDuration = new Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['query_type', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    this.databaseConnectionsActive = new Gauge({
      name: 'database_connections_active',
      help: 'Number of active database connections',
    });

    // Application Metrics
    this.errorsTotal = new Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'endpoint'],
    });

    this.tasksCompletedTotal = new Counter({
      name: 'tasks_completed_total',
      help: 'Total number of completed tasks',
      labelNames: ['zone_id'],
    });

    this.submissionsTotal = new Counter({
      name: 'submissions_total',
      help: 'Total number of task submissions',
      labelNames: ['status'],
    });
  }

  getMetrics(): Promise<string> {
    return register.metrics();
  }

  getContentType(): string {
    return register.contentType;
  }
}

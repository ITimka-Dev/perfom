import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MonitoringService } from '../../modules/monitoring/monitoring.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(
    @Optional() @Inject(MonitoringService) private monitoringService?: MonitoringService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const now = Date.now();

    // Log request
    this.logger.log(
      `[Request] ${method} ${url} - ${ip} - ${userAgent}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const delay = Date.now() - now;
          
          // Track metrics
          if (this.monitoringService) {
            this.monitoringService.incrementRequestCount(delay);
          }
          
          this.logger.log(
            `[Response] ${method} ${url} - ${statusCode} - ${delay}ms`,
          );
        },
        error: (error) => {
          const delay = Date.now() - now;
          
          // Track error metrics
          if (this.monitoringService) {
            this.monitoringService.incrementRequestCount(delay);
            this.monitoringService.incrementErrorCount();
          }
          
          this.logger.error(
            `[Error] ${method} ${url} - ${error.status || 500} - ${delay}ms`,
            error.stack,
          );
        },
      }),
    );
  }
}

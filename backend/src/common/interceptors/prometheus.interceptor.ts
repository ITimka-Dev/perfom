import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrometheusService } from '../../modules/monitoring/prometheus.service';

@Injectable()
export class PrometheusInterceptor implements NestInterceptor {
  constructor(private readonly prometheusService: PrometheusService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          const duration = (Date.now() - startTime) / 1000;

          // Record HTTP metrics
          this.prometheusService.httpRequestsTotal.inc({
            method: req.method,
            route: req.route?.path || req.url,
            status_code: res.statusCode,
          });

          this.prometheusService.httpRequestDuration.observe(
            {
              method: req.method,
              route: req.route?.path || req.url,
              status_code: res.statusCode,
            },
            duration,
          );
        },
        error: (error) => {
          const res = context.switchToHttp().getResponse();
          const duration = (Date.now() - startTime) / 1000;

          // Record error metrics
          this.prometheusService.httpRequestsTotal.inc({
            method: req.method,
            route: req.route?.path || req.url,
            status_code: error.status || 500,
          });

          this.prometheusService.httpRequestDuration.observe(
            {
              method: req.method,
              route: req.route?.path || req.url,
              status_code: error.status || 500,
            },
            duration,
          );

          this.prometheusService.errorsTotal.inc({
            type: error.name || 'UnknownError',
            endpoint: req.route?.path || req.url,
          });
        },
      }),
    );
  }
}

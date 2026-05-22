import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: any;
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      // Handle validation errors (array of constraints)
      if (typeof response === 'object' && response !== null) {
        const resp = response as any;
        if (Array.isArray(resp.message)) {
          // ValidationPipe returns array of error messages
          message = resp.message.join(', ');
        } else if (resp.message) {
          message = resp.message;
        } else {
          message = resp;
        }
      } else {
        message = response;
      }
    } else {
      message = 'Internal server error';
    }

    // Log error details with request body for debugging
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status}`,
      exception instanceof Error ? exception.stack : 'Unknown error',
    );
    
    // Log request body for POST/PUT/PATCH requests to help debug validation errors
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      this.logger.debug(`Request body: ${JSON.stringify(request.body)}`);
    }

    // Don't expose internal error details in production
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: status === HttpStatus.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : message,
    };

    response.status(status).json(errorResponse);
  }
}

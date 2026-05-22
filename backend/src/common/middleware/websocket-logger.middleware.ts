import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class WebSocketLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (process.env.NODE_ENV === 'development') {
      const { method, originalUrl, headers } = req;
      const isWebSocket = headers.upgrade === 'websocket';

      if (isWebSocket) {
        console.log('[WebSocket] Incoming connection attempt:', {
          method,
          url: originalUrl,
          timestamp: new Date().toISOString(),
        });
      }
    }
    next();
  }
}

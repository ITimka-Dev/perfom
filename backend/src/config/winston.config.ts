import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import { join } from 'path';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for console logs
const consoleFormat = printf(({ level, message, timestamp, stack, context }) => {
  const contextStr = context ? `[${context}]` : '';
  return `${timestamp} ${level} ${contextStr} ${stack || message}`;
});

// Custom format for file logs
const fileFormat = printf(({ level, message, timestamp, stack, context, ...metadata }) => {
  const contextStr = context ? `[${context}]` : '';
  const metadataStr = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
  return `${timestamp} ${level} ${contextStr} ${stack || message} ${metadataStr}`;
});

// Create logs directory path
const logsDir = join(process.cwd(), 'logs');

export const winstonConfig: WinstonModuleOptions = {
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize(),
        consoleFormat,
      ),
    }),
    // Error logs
    new winston.transports.File({
      filename: join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined logs
    new winston.transports.File({
      filename: join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // HTTP logs
    new winston.transports.File({
      filename: join(logsDir, 'http.log'),
      level: 'http',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: join(logsDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: join(logsDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
};

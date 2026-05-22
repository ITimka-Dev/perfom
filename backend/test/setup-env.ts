process.env.NODE_ENV ??= 'test';
process.env.PORT ??= '3001';

process.env.DB_HOST ??= 'localhost';
process.env.DB_PORT ??= '5432';
process.env.DB_USERNAME ??= 'postgres';
process.env.DB_PASSWORD ??= 'postgres';
process.env.DB_DATABASE ??= 'edufarm';

process.env.REDIS_HOST ??= 'localhost';
process.env.REDIS_PORT ??= '6379';

process.env.JWT_SECRET ??= 'test-jwt-secret-key-min-32-chars';
process.env.JWT_EXPIRES_IN ??= '7d';
process.env.CORS_ORIGIN ??= 'http://localhost:5173';

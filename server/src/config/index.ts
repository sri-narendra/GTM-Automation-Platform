import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/gtm-automation',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  redis: {
    url: process.env.REDIS_URL || '',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
  scraping: {
    timeout: parseInt(process.env.SCRAPING_TIMEOUT || '15000', 10),
    retries: parseInt(process.env.SCRAPING_RETRIES || '3', 10),
  },
  jobs: {
    maxRetries: parseInt(process.env.MAX_JOB_RETRIES || '3', 10),
    retryDelayMs: parseInt(process.env.JOB_RETRY_DELAY_MS || '5000', 10),
  },
  resume: {
    maxSizeMB: parseInt(process.env.RESUME_MAX_SIZE_MB || '5', 10),
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

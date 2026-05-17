import pino from 'pino';
import { config } from '../config';

const transport = config.isDevelopment
  ? pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
      },
    })
  : undefined;

export const logger = pino(
  {
    level: config.logging.level,
    name: 'gtm-api',
  },
  transport
);

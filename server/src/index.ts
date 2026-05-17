import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cron from 'node-cron';

import { config } from './config';
import { logger } from './utils/logger';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { processJobs } from './services/jobQueue';
import { processEnrichmentJob } from './jobs/enrichment.job';
import { executeWorkflowJob } from './jobs/workflow.job';
import { runCleanup, runRetryFailed } from './jobs/cleanup.job';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.isDevelopment) {
  app.use(morgan('dev'));
}

app.use('/api', apiLimiter);
app.use('/api', routes);

app.use(errorHandler);

async function connectDB(): Promise<void> {
  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await mongoose.connect(config.mongodbUri);
      logger.info('Connected to MongoDB');
      return;
    } catch (err) {
      attempt++;
      logger.error({ err, attempt }, `Failed to connect to MongoDB (attempt ${attempt}/${maxRetries})`);
      if (attempt >= maxRetries) {
        logger.fatal('Could not connect to MongoDB after multiple retries. Exiting.');
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error({ err }, 'MongoDB connection error');
});

function startJobProcessors(): void {
  const stopEnrichment = processJobs('enrichment', processEnrichmentJob, {
    pollIntervalMs: 3000,
    batchSize: 5,
  });

  const stopBulkEnrich = processJobs('bulk_enrich', processEnrichmentJob, {
    pollIntervalMs: 5000,
    batchSize: 3,
  });

  const stopWorkflow = processJobs('workflow', executeWorkflowJob, {
    pollIntervalMs: 5000,
    batchSize: 2,
  });

  process.on('SIGTERM', () => {
    logger.info('Stopping job processors...');
    stopEnrichment();
    stopBulkEnrich();
    stopWorkflow();
  });
}

function scheduleCronJobs(): void {
  cron.schedule('0 */6 * * *', () => {
    runCleanup();
  });

  cron.schedule('*/30 * * * *', () => {
    runRetryFailed();
  });

  logger.info('Cron jobs scheduled (cleanup every 6h, retry every 30m)');
}

async function start(): Promise<void> {
  await connectDB();

  app.listen(config.port, () => {
    logger.info({
      port: config.port,
      env: config.nodeEnv,
      corsOrigin: config.cors.origin,
    }, 'GTM Automation Platform API server started');
  });

  startJobProcessors();
  scheduleCronJobs();
}

start().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});

export default app;

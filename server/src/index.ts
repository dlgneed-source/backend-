import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import { initializeCronJobs } from './utils/cronJobs';
import { AppError } from './utils/errors';
import { errorResponse } from './utils/response';

// Import controllers
import { getPlans, getPlanById, enrollInPlan, getUserEnrollments } from './controllers/planController';

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// ============================================================================
// API ROUTES
// ============================================================================

// Plans
app.get('/api/plans', getPlans);
app.get('/api/plans/:planId', getPlanById);
app.post('/api/plans/enroll', enrollInPlan);  // TODO: Add auth middleware
app.get('/api/enrollments', getUserEnrollments);  // TODO: Add auth middleware

// TODO: Add these routes as you build more controllers:
// app.post('/api/withdraw', withdrawController);
// app.post('/api/gift-codes/redeem', giftCodeController);
// app.get('/api/admin/users', adminController);
// app.post('/api/admin/gift-codes', adminGiftCodeController);

// ============================================================================
// ERROR HANDLING
// ============================================================================
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode, err.code);
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  return errorResponse(res, 'Internal server error', 500);
});

// ============================================================================
// START SERVER
// ============================================================================
app.listen(config.port, () => {
  logger.info(`🚀 eAkhuwat Backend running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);

  // Initialize cron jobs
  initializeCronJobs();
});

export default app;

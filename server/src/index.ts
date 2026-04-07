import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import { initializeCronJobs } from './utils/cronJobs';
import { AppError } from './utils/errors';
import { errorResponse } from './utils/response';
import { initSocketIO } from './socket/socketHandler';

// Middleware
import { authMiddleware, adminMiddleware } from './middleware/auth';

// Controllers
import { getPlans, getPlanById, enrollInPlan, getUserEnrollments } from './controllers/planController';
import { login } from './controllers/authController';
import { getUserProfile, getUserTransactions, getUserReferralTree, getUserStats } from './controllers/userController';
import {
  getGiftCodes, createGiftCode, revokeGiftCode, redeemGiftCode,
  getUsers, suspendUser, unsuspendUser, getDashboardStats,
  getWithdrawals, approveWithdrawal, rejectWithdrawal,
  getFlushouts, getCommissions, getSecurityLogs,
  getPools, requestWithdrawal,
} from './controllers/adminController';
import { getRooms, createRoom, joinRoom, getRoomMessages, getDMMessages } from './controllers/chatController';

const app = express();
const httpServer = createServer(app);

// ============================================================================
// MIDDLEWARE
// ============================================================================
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));

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
// PUBLIC ROUTES
// ============================================================================
app.post('/api/auth/login', login);
app.get('/api/plans', getPlans);
app.get('/api/plans/:planId', getPlanById);
app.get('/api/pools', getPools);

// ============================================================================
// AUTHENTICATED USER ROUTES
// ============================================================================
app.post('/api/plans/enroll', authMiddleware, enrollInPlan);
app.get('/api/enrollments', authMiddleware, getUserEnrollments);
app.get('/api/user/profile', authMiddleware, getUserProfile);
app.get('/api/user/transactions', authMiddleware, getUserTransactions);
app.get('/api/user/referral-tree', authMiddleware, getUserReferralTree);
app.get('/api/user/stats', authMiddleware, getUserStats);
app.post('/api/withdraw', authMiddleware, requestWithdrawal);
app.get('/api/withdraw/history', authMiddleware, getUserTransactions); // reuse
app.post('/api/gift-codes/redeem', authMiddleware, redeemGiftCode);

// ============================================================================
// ADMIN ROUTES
// ============================================================================
app.get('/api/admin/dashboard', authMiddleware, adminMiddleware, getDashboardStats);
app.get('/api/admin/users', authMiddleware, adminMiddleware, getUsers);
app.post('/api/admin/users/:id/suspend', authMiddleware, adminMiddleware, suspendUser);
app.post('/api/admin/users/:id/unsuspend', authMiddleware, adminMiddleware, unsuspendUser);
app.get('/api/admin/gift-codes', authMiddleware, adminMiddleware, getGiftCodes);
app.post('/api/admin/gift-codes', authMiddleware, adminMiddleware, createGiftCode);
app.post('/api/admin/gift-codes/:id/revoke', authMiddleware, adminMiddleware, revokeGiftCode);
app.get('/api/admin/withdrawals', authMiddleware, adminMiddleware, getWithdrawals);
app.post('/api/admin/withdrawals/:id/approve', authMiddleware, adminMiddleware, approveWithdrawal);
app.post('/api/admin/withdrawals/:id/reject', authMiddleware, adminMiddleware, rejectWithdrawal);
app.get('/api/admin/pools', authMiddleware, adminMiddleware, getPools);
app.get('/api/admin/flushouts', authMiddleware, adminMiddleware, getFlushouts);
app.get('/api/admin/commissions', authMiddleware, adminMiddleware, getCommissions);
app.get('/api/admin/security-logs', authMiddleware, adminMiddleware, getSecurityLogs);

// Chat / Community Routes
app.get('/api/rooms', authMiddleware, getRooms);
app.post('/api/rooms', authMiddleware, createRoom);
app.post('/api/rooms/:roomId/join', authMiddleware, joinRoom);
app.get('/api/rooms/:roomId/messages', authMiddleware, getRoomMessages);
app.get('/api/dm/:targetUserId/messages', authMiddleware, getDMMessages);

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
// Initialize Socket.IO
initSocketIO(httpServer);

httpServer.listen(config.port, () => {
  logger.info(`🚀 eAkhuwat Backend running on port ${config.port}`);
  logger.info(`🔌 Socket.IO ready for real-time connections`);
  logger.info(`Environment: ${config.nodeEnv}`);
  initializeCronJobs();
});

export default app;

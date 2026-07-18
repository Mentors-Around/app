// src/app.js
import express      from 'express';
import cors         from 'cors';
import cookieParser from 'cookie-parser';
import morgan       from 'morgan';

// Config & init (order matters — cloudinary must init before services use it)
import './config/cloudinary.config.js';
import corsOptions                                            from './config/cors.config.js';
import { securityMiddlewares, requestSizeLimits }            from './middlewares/security.middleware.js';
import { correlationIdMiddleware }                           from './middlewares/correlationId.middleware.js';
import { requestLoggerMiddleware }                           from './middlewares/requestLogger.middleware.js';
import { mongoSanitizeMiddleware, xssSanitizeMiddleware }    from './middlewares/sanitize.middleware.js';
import { globalLimiter }                                     from './middlewares/rateLimit.middleware.js';
import { errorHandler }                                      from './middlewares/errorHandler.middleware.js';
import { notFound }                                          from './middlewares/notFound.middleware.js';
import logger                                                from './config/logger.config.js';

// Routes
import authRoutes       from './routes/auth.routes.js';
import userRoutes       from './routes/user.routes.js';
import teacherRoutes    from './routes/teacher.routes.js';
import classroomRoutes  from './routes/classroom.routes.js';
import enrollmentRoutes from './routes/enrollment.routes.js';
import walletRoutes     from './routes/wallet.routes.js';
import payoutRoutes     from './routes/payout.routes.js';
import adminRoutes      from './routes/admin.routes.js';
import reportRoutes     from './routes/report.routes.js';
import testRoutes           from './routes/test.routes.js';
import notificationRoutes  from './routes/notification.routes.js';
import webhookRoutes    from './routes/webhook.routes.js';

const app = express();

// ── Trust proxy (required for rate limiter to get real IPs behind nginx/CF) ──
app.set('trust proxy', 1);

// ── Security headers (helmet, etc.) ──────────────────────────────────────────
app.use(securityMiddlewares);

// ── Correlation ID (must be before logging) ───────────────────────────────────
app.use(correlationIdMiddleware);

// ── HTTP request logging ──────────────────────────────────────────────────────
app.use(morgan('combined', { stream: logger.stream }));
app.use(requestLoggerMiddleware);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors(corsOptions));

// ── WEBHOOK ROUTE: must come BEFORE express.json() ────────────────────────────
// Razorpay HMAC signature verification requires the raw Buffer body.
// express.raw() is applied per-route inside webhook.routes.js.
app.use('/api/webhooks', webhookRoutes);

// ── Global rate limiter ───────────────────────────────────────────────────────
app.use('/api', globalLimiter);

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: requestSizeLimits.jsonLimit }));
app.use(express.urlencoded({ extended: true, limit: requestSizeLimits.urlencodedLimit }));
app.use(cookieParser());

// ── Input sanitisation (after body parsing) ───────────────────────────────────
app.use(mongoSanitizeMiddleware);
app.use(xssSanitizeMiddleware);

// ─────────────────────────────────────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',        authRoutes);
app.use('/api/v1/users',       userRoutes);
app.use('/api/v1/teachers',    teacherRoutes);
app.use('/api/v1/classrooms',  classroomRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);
app.use('/api/v1/wallet',      walletRoutes);
app.use('/api/v1/payouts',     payoutRoutes);
app.use('/api/v1/admin',       adminRoutes);
app.use('/api/v1/reports',     reportRoutes);
app.use('/api/v1/tests',         testRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.status(200).json({
    status:    'ok',
    uptime:    Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    version:   process.env.npm_package_version || '1.0.0',
  }),
);

// ── 404 + Global error handler (must be last) ─────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
// src/index.js
import { connectDB, disconnectDB } from './db/index.js';
import app                         from './app.js';
import env                         from './config/env.config.js';
import logger                      from './config/logger.config.js';
import { initCronJobs }            from './cron.js';
import { EmailService }            from './services/email.service.js';

const port = env.PORT;
let server;

connectDB()
  .then(async () => {
    if (env.EMAIL_PROVIDER !== 'mock') {
      const emailOk = await EmailService.verifyConnection();
      if (!emailOk) {
        logger.warn(
          '⚠️  Email transport NOT configured correctly — OTPs will NOT be delivered.\n' +
          '   Check your GMAIL_USER / GMAIL_APP_PASSWORD in .env and restart.',
        );
      }
    } else {
      logger.info('[Email] Running in MOCK mode — OTPs logged to console, not emailed');
    }

    // ── Start HTTP server ───────────────────────────────────────────────────
    server = app.listen(port, () => {
      logger.info(`🚀 TrueEd Server running at port ${port} in ${env.NODE_ENV} mode`);
    });

    // ── Start background cron workers ───────────────────────────────────────
    initCronJobs();
  })
  .catch((error) => {
    logger.error('💥 Critical application boot failure', error);
    process.exit(1);
  });

// ─────────────────────────────────────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  logger.warn(`⚠️ ${signal} received — initiating graceful shutdown`);

  if (server) {
    server.close(async () => {
      try {
        await disconnectDB();
        logger.info('🍃 MongoDB connection closed');
        logger.info('🛑 TrueEd Server shutdown complete. Goodbye!');
        process.exit(0);
      } catch (err) {
        logger.error('💥 Error during DB disconnection', err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }

  // Force-exit if graceful shutdown hangs
  setTimeout(() => {
    logger.error('💥 Forced shutdown after 10 s timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ─────────────────────────────────────────────────────────────────────────────
// UNHANDLED CRASHES
// ─────────────────────────────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error('💥 FATAL: Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('💥 FATAL: Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack:  reason instanceof Error ? reason.stack   : undefined,
  });
  process.exit(1);
});
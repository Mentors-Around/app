/**
 * db/index.js
 *
 * MongoDB connection module with:
 *   - Exponential backoff retry on initial connect
 *   - Event-driven lifecycle logging
 *   - Graceful shutdown hook registration
 *   - Connection pool tuning for production load
 *
 * WHY RETRY: In containerised deployments (Docker / Kubernetes) the app
 * container often starts before the DB pod is ready.  Retry prevents a
 * hard crash during orchestrated startup sequences.
 *
 * POOL SIZE: 10 connections handles ~1 000 concurrent requests comfortably
 * (each Mongoose operation borrows a connection for ~1-5 ms).  Increase
 * maxPoolSize when you move to dedicated DB nodes.
 */

import mongoose from "mongoose";
import env from "../config/env.config.js";
import logger from "../config/logger.config.js";

// ─── Configuration ────────────────────────────────────────────────────────────

const CONNECT_OPTIONS = {
  dbName: env.DB_NAME,
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  writeConcern: { w: "majority" },
};

const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 16000]; // ~31 s total

// ─── Event hooks ──────────────────────────────────────────────────────────────

function attachMongooseEventHooks() {
  mongoose.connection.on("connected", () =>
    logger.info("MongoDB: connection established")
  );
  mongoose.connection.on("disconnected", () =>
    logger.warn("MongoDB: disconnected — reconnecting...")
  );
  mongoose.connection.on("reconnected", () =>
    logger.info("MongoDB: reconnected")
  );
  mongoose.connection.on("error", (err) =>
    logger.error("MongoDB: connection error", { error: err.message })
  );
}

mongoose.set("sanitizeFilter", false);

// ─── Connect with retry ───────────────────────────────────────────────────────

export async function connectDB() {
  attachMongooseEventHooks();

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      await mongoose.connect(env.MONGODB_URI, CONNECT_OPTIONS);
      logger.info("MongoDB: initial connection successful", {
        db: env.DB_NAME,
      });
      return;
    } catch (err) {
      if (attempt === RETRY_DELAYS_MS.length) {
        logger.error("MongoDB: all connection attempts failed — aborting", {
          error: err.message,
        });
        process.exit(1);
      }

      const delay = RETRY_DELAYS_MS[attempt];
      logger.warn(`MongoDB: connection attempt ${attempt + 1} failed — retrying in ${delay}ms`, {
        error: err.message,
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────

export async function disconnectDB() {
  await mongoose.connection.close();
  logger.info("MongoDB: connection closed gracefully");
}
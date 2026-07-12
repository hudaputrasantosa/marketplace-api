import { config } from "./common/config/env";
import { logger } from "./common/logger/logger";
import { captureServerError, initGlitchTip } from "./common/observability/glitchtip";
import { startOtel, stopOtel } from "./common/observability/otel";
import type { DependencyCheckResult } from "./common/startup/startup-banner";

// OTel must start before any instrumented module (fastify, mysql2, ioredis, ...) is loaded,
// so those are imported dynamically below rather than statically at the top of this file.
startOtel();
initGlitchTip();

/**
 * Populated once the app/pool/services are up - the outermost error boundary
 * (uncaughtException/unhandledRejection) and the OS signal handlers both call this same
 * routine so there's a single, consistent shutdown path regardless of what triggered it.
 */
let cleanup: (() => Promise<void>) | undefined;
let terminating = false;

async function terminate(reason: string, exitCode: number): Promise<never> {
  if (terminating) return process.exit(exitCode);
  terminating = true;

  logger.info(`Terminating (${reason}), exit code ${exitCode}...`);
  console.log(`\nTerminating (${reason})...`);

  try {
    await cleanup?.();
    logger.info("Shutdown complete");
    console.log("Shutdown complete");
  } catch (error) {
    logger.error(`Error during shutdown: ${error}`);
  }

  return process.exit(exitCode);
}

// Outermost error boundary: catches anything that escapes every other layer (Fastify's own
// error handler only covers request-scoped errors; this also covers background jobs, the
// RabbitMQ consumer, and any other async code). Process state is unreliable after an uncaught
// exception, so we shut down rather than keep serving requests.
process.on("uncaughtException", (error) => {
  logger.error(`Uncaught exception: ${error.stack ?? error}`);
  captureServerError(error);
  void terminate("uncaughtException", 1);
});

process.on("unhandledRejection", (reason) => {
  logger.error(
    `Unhandled rejection: ${reason instanceof Error ? (reason.stack ?? reason) : reason}`,
  );
  captureServerError(reason);
  void terminate("unhandledRejection", 1);
});

async function main() {
  const { buildApp } = await import("./app");
  const { pool } = await import("./common/database/client");
  const { redisService } = await import("./common/redis/redis.service");
  const { EXAMPLE_EVENTS_QUEUE, rabbitMqService, startExampleConsumer } = await import(
    "./common/rabbitmq/rabbitmq.service"
  );
  const { scheduleMonthlyReportJob } = await import("./common/jobs/monthly-report.job");
  const { withSpinner, printStartupBanner } = await import("./common/startup/startup-banner");

  const dependencies: DependencyCheckResult[] = [];

  // MySQL is a hard requirement - fail fast if it's unreachable.
  const mysqlCheck = await withSpinner("Connecting to MySQL", () => pool.query("SELECT 1"));
  if (mysqlCheck.error) throw mysqlCheck.error;
  logger.info("MySQL connection verified");
  dependencies.push({ name: "MySQL", status: "connected", ms: mysqlCheck.ms });

  // Redis/RabbitMQ are "use when needed" services - warn and keep running without them.
  const redisCheck = await withSpinner("Connecting to Redis", () => redisService.ping());
  if (redisCheck.error) {
    logger.warn(`Redis unavailable, continuing without it: ${redisCheck.error}`);
    dependencies.push({ name: "Redis", status: "unavailable", ms: redisCheck.ms });
  } else {
    dependencies.push({ name: "Redis", status: "connected", ms: redisCheck.ms });
  }

  const rabbitMqCheck = await withSpinner("Connecting to RabbitMQ", async () => {
    await rabbitMqService.checkConnection();
    await startExampleConsumer();
  });
  if (rabbitMqCheck.error) {
    logger.warn(`RabbitMQ unavailable, continuing without it: ${rabbitMqCheck.error}`);
    dependencies.push({ name: "RabbitMQ", status: "unavailable", ms: rabbitMqCheck.ms });
  } else {
    logger.info(`RabbitMQ consumer ready (queue: "${EXAMPLE_EVENTS_QUEUE}")`);
    dependencies.push({ name: "RabbitMQ", status: "connected", ms: rabbitMqCheck.ms });
  }

  try {
    await scheduleMonthlyReportJob();
  } catch (error) {
    logger.warn(`Could not schedule the monthly report job (Redis required): ${error}`);
  }

  const app = await buildApp();
  await app.listen({ port: config.app.port, host: "0.0.0.0" });
  printStartupBanner({ dependencies, port: config.app.port });

  cleanup = async () => {
    await app.close();
    await pool.end();
    await redisService.close().catch(() => undefined);
    await rabbitMqService.close().catch(() => undefined);
    await stopOtel();
  };

  process.on("SIGINT", () => void terminate("SIGINT", 0));
  process.on("SIGTERM", () => void terminate("SIGTERM", 0));
}

main().catch((error) => {
  logger.error(`Failed to start server: ${error}`);
  console.error("Failed to start server:", error);
  process.exit(1);
});

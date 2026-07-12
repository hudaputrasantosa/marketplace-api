import type { FastifyInstance } from "fastify";
import { HttpStatus } from "../constants/http-status";
import { pool } from "../database/client";
import { rabbitMqService } from "../rabbitmq/rabbitmq.service";
import { redisService } from "../redis/redis.service";

type DependencyStatus = "up" | "down";

/**
 * Infra-facing healthcheck, deliberately outside the `/api` prefix and the business
 * `{status,message,data}` response envelope - this is for orchestrators/Docker/uptime probes,
 * not part of the marketplace API contract. Pings every dependency on every call: MySQL is a
 * hard requirement (503 if it's down, mirroring the fatal startup check in main.ts), Redis and
 * RabbitMQ are soft (reported but don't fail the response).
 */
export async function registerHealthCheck(app: FastifyInstance): Promise<void> {
  app.get("/health", async (_request, reply) => {
    const [redisStatus, rabbitMqStatus] = await Promise.all([pingRedis(), pingRabbitMq()]);

    let mysqlStatus: DependencyStatus = "up";
    try {
      await pool.query("SELECT 1");
    } catch {
      mysqlStatus = "down";
    }

    const healthy = mysqlStatus === "up";

    return reply.status(healthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).send({
      status: healthy ? "ok" : "error",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      dependencies: {
        mysql: mysqlStatus,
        redis: redisStatus,
        rabbitmq: rabbitMqStatus,
      },
    });
  });
}

async function pingRedis(): Promise<DependencyStatus> {
  try {
    await redisService.ping();
    return "up";
  } catch {
    return "down";
  }
}

async function pingRabbitMq(): Promise<DependencyStatus> {
  try {
    await rabbitMqService.checkConnection();
    return "up";
  } catch {
    return "down";
  }
}

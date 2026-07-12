import { z } from "zod";

/**
 * `z.coerce.boolean()` just runs `Boolean(value)`, so the string "false" - like every
 * non-empty string - coerces to `true`. This parses "true"/"false" (case-insensitive) properly.
 */
const booleanFlag = (defaultValue: boolean) =>
  z
    .string()
    .optional()
    .transform((value) => (value === undefined ? defaultValue : value.toLowerCase() === "true"));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  CORS_ORIGIN: z.string().default("http://localhost:8080"),

  SECRET_KEY: z.string().min(1).default("dev-secret-key-change-me"),
  REFRESH_SECRET_KEY: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default("1h"),

  DB_HOST: z.string().default("127.0.0.1"),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USERNAME: z.string().default("root"),
  DB_PASSWORD: z.string().default(""),
  DB_NAME: z.string().default("db_market"),
  DB_POOL_SIZE: z.coerce.number().int().positive().default(10),
  DB_LOG_QUERIES: booleanFlag(false),

  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  RABBITMQ_URL: z.string().default("amqp://guest:guest@127.0.0.1:5672"),
  // Browser-facing management UI - can't be derived from RABBITMQ_URL since the host/port/
  // protocol differ (e.g. inside Docker the amqp host is "rabbitmq", the management UI is
  // still browsed at "localhost").
  RABBITMQ_MANAGEMENT_URL: z.string().default("http://localhost:15672"),

  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW: z.string().default("5 minutes"),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  AUTH_RATE_LIMIT_WINDOW: z.string().default("5 minutes"),

  GLITCHTIP_DSN: z.string().optional(),

  OTEL_ENABLED: booleanFlag(false),
  OTEL_SERVICE_NAME: z.string().default("marketplace-api"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default("http://127.0.0.1:4318"),

  MONTHLY_REPORT_CRON: z.string().default("0 0 1 * *"),

  // HTTP Basic Auth for the Bull Board UI (/api/admin/queues) - it's opened directly in a
  // browser, which can't attach an Authorization: Bearer header on plain navigation, so it's
  // gated separately from the rest of the API's JWT scheme.
  BULL_BOARD_USERNAME: z.string().default("admin"),
  BULL_BOARD_PASSWORD: z.string().default("change-me"),

  // Baked in at Docker build time (`.git` is excluded from the image via .dockerignore, so
  // `git rev-parse` won't work at runtime in a container) - shown in the startup banner.
  GIT_COMMIT_SHA: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

const env = parsed.data;

export const config = {
  app: {
    nodeEnv: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === "development",
    isProduction: env.NODE_ENV === "production",
    isTest: env.NODE_ENV === "test",
    port: env.PORT,
    corsOrigin: env.CORS_ORIGIN,
    commitSha: env.GIT_COMMIT_SHA,
  },
  auth: {
    secretKey: env.SECRET_KEY,
    refreshSecretKey: env.REFRESH_SECRET_KEY,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
  },
  database: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    name: env.DB_NAME,
    poolSize: env.DB_POOL_SIZE,
    logQueries: env.DB_LOG_QUERIES,
  },
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },
  rabbitmq: {
    url: env.RABBITMQ_URL,
    managementUrl: env.RABBITMQ_MANAGEMENT_URL,
  },
  security: {
    rateLimit: {
      global: { max: env.RATE_LIMIT_MAX, timeWindow: env.RATE_LIMIT_WINDOW },
      auth: { max: env.AUTH_RATE_LIMIT_MAX, timeWindow: env.AUTH_RATE_LIMIT_WINDOW },
    },
  },
  observability: {
    glitchtipDsn: env.GLITCHTIP_DSN,
    otel: {
      enabled: env.OTEL_ENABLED,
      serviceName: env.OTEL_SERVICE_NAME,
      exporterUrl: env.OTEL_EXPORTER_OTLP_ENDPOINT,
    },
  },
  jobs: {
    monthlyReportCron: env.MONTHLY_REPORT_CRON,
  },
  bullBoard: {
    username: env.BULL_BOARD_USERNAME,
    password: env.BULL_BOARD_PASSWORD,
  },
} as const;

export type Config = typeof config;

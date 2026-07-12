import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { config } from "../config/env";
import { logger } from "../logger/logger";
import * as schema from "./schema";

/** A single shared pool is created once and reused for every query - never per-request. */
export const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.username,
  password: config.database.password,
  database: config.database.name,
  connectionLimit: config.database.poolSize,
  waitForConnections: true,
});

export const db = drizzle(pool, {
  schema,
  mode: "default",
  logger: config.database.logQueries
    ? { logQuery: (query, params) => logger.debug({ params }, `[sql] ${query}`) }
    : false,
});

export type Database = typeof db;

/** The transaction handle passed into `db.transaction(async (tx) => ...)` callbacks. */
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

/**
 * Anything a repository can run a query against - either the base pooled connection or an
 * existing transaction. Lets repository methods optionally join a caller-supplied transaction
 * instead of always running on the base connection.
 */
export type Executor = Database | Transaction;

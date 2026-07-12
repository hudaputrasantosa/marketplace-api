import { createWriteStream } from "node:fs";
import { createRequire } from "node:module";
import pino, { type StreamEntry } from "pino";
import type PinoPretty from "pino-pretty";
import { config } from "../config/env";

const streams: StreamEntry[] = [
  { level: "debug", stream: createWriteStream("logs/combined.log", { flags: "a" }) },
  { level: "error", stream: createWriteStream("logs/error.log", { flags: "a" }) },
];

if (config.app.isDevelopment) {
  // Synchronous require (not a worker-thread `pino.transport`, which is flaky under Bun) so
  // pino-pretty - a devDependency - is only ever touched in this branch, never in production.
  const nodeRequire = createRequire(import.meta.url);
  const pretty = nodeRequire("pino-pretty") as typeof PinoPretty;
  streams.push({ level: "debug", stream: pretty({ colorize: true, ignore: "pid,hostname" }) });
} else if (!config.app.isTest) {
  // Production stays silent on stdout for non-error logs, relying on the file transports
  // instead - but errors (5xx, uncaught exceptions, ...) still print to console so they're
  // visible via `docker logs`/log aggregation without needing to exec into the container.
  streams.push({ level: "error", stream: process.stdout });
}

export const logger = pino({ level: "debug" }, pino.multistream(streams));

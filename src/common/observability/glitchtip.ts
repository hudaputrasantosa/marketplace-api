import * as Sentry from "@sentry/node";
import { config } from "../config/env";
import { logger } from "../logger/logger";

/**
 * GlitchTip is Sentry-protocol compatible, so the standard @sentry/node SDK works against it.
 * Safe no-op when GLITCHTIP_DSN isn't set - nothing is sent anywhere.
 */
export function initGlitchTip(): void {
  if (!config.observability.glitchtipDsn) {
    logger.info("GlitchTip disabled (no GLITCHTIP_DSN configured)");
    return;
  }

  Sentry.init({
    dsn: config.observability.glitchtipDsn,
    environment: config.app.nodeEnv,
    tracesSampleRate: 0,
  });
  logger.info("GlitchTip error capturing enabled");
}

/** Reports an un-identified (5xx) error - call from the global error handler. */
export function captureServerError(error: unknown, requestId?: string): void {
  if (!config.observability.glitchtipDsn) return;
  Sentry.captureException(error, requestId ? { tags: { requestId } } : undefined);
}

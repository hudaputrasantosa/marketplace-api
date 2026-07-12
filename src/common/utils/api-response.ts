import type { FastifyReply } from "fastify";
import { HttpStatus } from "../constants/http-status";
import { config } from "../config/env";
import { ErrorCode } from "../errors/error-codes";
import { captureServerError } from "../observability/glitchtip";

export interface ValidationErrorItem {
  type: "field";
  message: string;
  path: string;
  location: "body";
}

/**
 * Single place that formats every reply/error the API sends, so controllers and the global
 * error handler never hand-build the response envelope themselves.
 */
export class ApiResponse {
  /** `{ success: true, message, meta?, data? }` - the standard success envelope. */
  static success<T>(
    reply: FastifyReply,
    statusCode: HttpStatus,
    message: string,
    data?: T,
    meta?: Record<string, unknown>,
  ) {
    return reply.status(statusCode).send({
      success: true,
      message,
      ...(meta !== undefined ? { meta } : {}),
      ...(data !== undefined ? { data } : {}),
    });
  }

  /**
   * `{ success: false, error: { code, message, requestId?, hint? } }` - the standard error
   * envelope. Un-identified 5xx errors are reported to GlitchTip right here (so callers never
   * have to remember to do it themselves) tagged with `requestId` for correlation, their
   * message is replaced with a generic one in production, and a `hint` (stack trace) is only
   * ever included outside production - never leaked to real users.
   */
  static error(
    reply: FastifyReply,
    statusCode: HttpStatus,
    code: ErrorCode,
    message: string,
    cause?: unknown,
    requestId?: string,
  ) {
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      captureServerError(cause ?? new Error(message), requestId);
    }

    const finalMessage =
      statusCode >= HttpStatus.INTERNAL_SERVER_ERROR && config.app.isProduction
        ? "Terjadi kesalahan pada server, silakan hubungi administrator."
        : message;

    const hint = config.app.isProduction
      ? undefined
      : cause instanceof Error
        ? cause.stack
        : cause !== undefined
          ? String(cause)
          : undefined;

    return reply.status(statusCode).send({
      success: false,
      error: {
        code,
        message: finalMessage,
        ...(requestId !== undefined ? { requestId } : {}),
        ...(hint !== undefined ? { hint } : {}),
      },
    });
  }

  /** `{ success: false, error: { code: "VALIDATION_ERROR", message, requestId?, details } }` - validation failures. */
  static validationError(reply: FastifyReply, details: ValidationErrorItem[], requestId?: string) {
    return reply.status(HttpStatus.BAD_REQUEST).send({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: "Validation failed.",
        ...(requestId !== undefined ? { requestId } : {}),
        details,
      },
    });
  }
}

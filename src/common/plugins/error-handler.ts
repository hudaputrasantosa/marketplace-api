import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { HttpStatus } from "../constants/http-status";
import { AppError } from "../errors/app-error";
import { ErrorCode } from "../errors/error-codes";
import { logger } from "../logger/logger";
import { ApiResponse, type ValidationErrorItem } from "../utils/api-response";

function extractZodError(error: unknown): ZodError | undefined {
  if (error instanceof ZodError) return error;
  const cause = (error as { cause?: unknown })?.cause;
  if (cause instanceof ZodError) return cause;
  return undefined;
}

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  const requestId = request.id;

  if (error instanceof AppError) {
    return ApiResponse.error(reply, error.statusCode, error.code, error.message, error, requestId);
  }

  const zodError = extractZodError(error);
  if (zodError) {
    const details: ValidationErrorItem[] = zodError.issues.map((issue) => ({
      type: "field",
      message: issue.message,
      path: issue.path.join("."),
      location: "body",
    }));
    return ApiResponse.validationError(reply, details, requestId);
  }

  const statusCode = error.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
  logger.error({ stack: error.stack, requestId }, `Error at ${error.message}`);

  if (statusCode === HttpStatus.NOT_FOUND) {
    return ApiResponse.error(
      reply,
      HttpStatus.NOT_FOUND,
      ErrorCode.ROUTE_NOT_FOUND,
      "Route tidak ditemukan",
      undefined,
      requestId,
    );
  }

  // GlitchTip capture (for 5xx) and the production message swap both happen inside
  // ApiResponse.error() itself.
  return ApiResponse.error(
    reply,
    statusCode as HttpStatus,
    ErrorCode.INTERNAL_SERVER_ERROR,
    `Error at ${error.message}`,
    error,
    requestId,
  );
}

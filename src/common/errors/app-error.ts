import { HttpStatus } from "../constants/http-status";
import type { ErrorCode } from "./error-codes";

/** Base class for expected, business-level errors (mirrors Nest's HttpException). */
export class AppError extends Error {
  constructor(
    public readonly statusCode: HttpStatus,
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class BadRequestError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(HttpStatus.BAD_REQUEST, code, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(HttpStatus.UNAUTHORIZED, code, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(HttpStatus.FORBIDDEN, code, message);
  }
}

export class NotFoundError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(HttpStatus.NOT_FOUND, code, message);
  }
}

export class ConflictError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(HttpStatus.CONFLICT, code, message);
  }
}

import type { FastifyReply, FastifyRequest } from "fastify";
import { HttpStatus } from "../constants/http-status";
import { ErrorCode } from "../errors/error-codes";
import { ApiResponse } from "../utils/api-response";

/** Verifies the JWT bearer token, mirroring the old authenticatedToken middleware 1:1. */
export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return ApiResponse.error(
      reply,
      HttpStatus.UNAUTHORIZED,
      ErrorCode.TOKEN_REQUIRED,
      "Token required",
      undefined,
      request.id,
    );
  }

  try {
    await request.jwtVerify();
  } catch {
    return ApiResponse.error(
      reply,
      HttpStatus.FORBIDDEN,
      ErrorCode.INVALID_TOKEN,
      "Invalid or Expired Token",
      undefined,
      request.id,
    );
  }
}

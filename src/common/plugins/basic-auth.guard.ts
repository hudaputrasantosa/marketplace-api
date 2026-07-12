import type { FastifyReply, FastifyRequest } from "fastify";
import { HttpStatus } from "../constants/http-status";
import { ErrorCode } from "../errors/error-codes";
import { ApiResponse } from "../utils/api-response";

/**
 * HTTP Basic Auth preHandler factory - for UIs (like Bull Board) opened directly in a browser,
 * which can't attach an `Authorization: Bearer` header on plain navigation, so the JWT-based
 * `authGuard` doesn't fit. Replies directly (never throws) and sets `WWW-Authenticate` on
 * failure so the browser shows its native Basic Auth login prompt.
 */
export function basicAuthGuard(realm: string, expected: { username: string; password: string }) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const [username, password] = decodeBasicAuthHeader(request.headers.authorization);

    if (username === expected.username && password === expected.password) return;

    reply.header("WWW-Authenticate", `Basic realm="${realm}", charset="UTF-8"`);
    return ApiResponse.error(
      reply,
      HttpStatus.UNAUTHORIZED,
      ErrorCode.INVALID_CREDENTIALS,
      "Invalid or missing credentials",
      undefined,
      request.id,
    );
  };
}

function decodeBasicAuthHeader(header: string | undefined): [username?: string, password?: string] {
  if (!header?.startsWith("Basic ")) return [];

  const decoded = Buffer.from(header.slice("Basic ".length), "base64").toString("utf-8");
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) return [];

  return [decoded.slice(0, separatorIndex), decoded.slice(separatorIndex + 1)];
}

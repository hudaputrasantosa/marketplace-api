import type { FastifyReply, FastifyRequest } from "fastify";
import { HttpStatus } from "../constants/http-status";
import { ErrorCode } from "../errors/error-codes";
import type { Role } from "../types/fastify";
import { ApiResponse } from "../utils/api-response";

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  pembeli: "Pembeli",
};

/** Mirrors the old checkRoleAdmin/checkRolePembeli middleware 1:1 (409 Conflict on mismatch). */
export function requireRole(role: Role) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.user.role !== role) {
      return ApiResponse.error(
        reply,
        HttpStatus.CONFLICT,
        ErrorCode.ROLE_MISMATCH,
        `Role anda bukan ${ROLE_LABEL[role]}!`,
        undefined,
        request.id,
      );
    }
  };
}

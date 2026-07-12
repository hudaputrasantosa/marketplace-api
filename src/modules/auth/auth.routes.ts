import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { config } from "../../common/config/env";
import { HttpStatus } from "../../common/constants/http-status";
import { authGuard } from "../../common/plugins/auth.guard";
import { guardedErrorResponses, successResponseSchema } from "../../common/utils/openapi-schemas";
import type { AuthController } from "./auth.controller";
import { loginSchema } from "./dto/login.dto";
import { registerSchema } from "./dto/register.dto";

const userResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  role: z.enum(["admin", "pembeli"]),
  email: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export function registerAuthRoutes(app: FastifyInstance, controller: AuthController) {
  const server = app.withTypeProvider<ZodTypeProvider>();
  // Auth endpoints are public and a common brute-force target - stricter limit than the
  // global default.
  const authRateLimit = { rateLimit: config.security.rateLimit.auth };

  server.post(
    "/register",
    {
      config: authRateLimit,
      schema: {
        tags: ["Auth"],
        summary: "Registrasi akun baru",
        body: registerSchema,
        response: { [HttpStatus.CREATED]: successResponseSchema(), ...guardedErrorResponses },
      },
    },
    controller.register,
  );

  server.post(
    "/login",
    {
      config: authRateLimit,
      schema: {
        tags: ["Auth"],
        summary: "Login dan mendapatkan JWT token",
        body: loginSchema,
        response: {
          [HttpStatus.OK]: successResponseSchema(
            z.object({ token: z.string(), user: userResponseSchema }),
          ),
          ...guardedErrorResponses,
        },
      },
    },
    controller.login,
  );

  server.post(
    "/logout",
    {
      preHandler: authGuard,
      schema: {
        tags: ["Auth"],
        summary: "Logout dari sistem",
        response: { [HttpStatus.OK]: successResponseSchema(), ...guardedErrorResponses },
      },
    },
    controller.logout,
  );
}

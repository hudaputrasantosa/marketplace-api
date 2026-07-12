import type { FastifyInstance } from "fastify";
import type { Database } from "../../common/database/client";
import { AuthController } from "./auth.controller";
import { AuthRepository } from "./auth.repository";
import { registerAuthRoutes } from "./auth.routes";
import { AuthService } from "./auth.service";

export function registerAuthModule(app: FastifyInstance, db: Database) {
  const repository = new AuthRepository(db);
  const service = new AuthService(repository);
  const controller = new AuthController(service);

  registerAuthRoutes(app, controller);
}

import type { FastifyInstance } from "fastify";
import type { Database } from "../../common/database/client";
import { WalletController } from "./wallet.controller";
import { WalletRepository } from "./wallet.repository";
import { registerWalletRoutes } from "./wallet.routes";
import { WalletService } from "./wallet.service";

export function registerWalletModule(app: FastifyInstance, db: Database) {
  const repository = new WalletRepository(db);
  const service = new WalletService(repository);
  const controller = new WalletController(service);

  registerWalletRoutes(app, controller);
}

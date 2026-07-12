import type { FastifyInstance } from "fastify";
import type { Database } from "../../common/database/client";
import { ProductRepository } from "../product/product.repository";
import { WalletRepository } from "../wallet/wallet.repository";
import { TransactionController } from "./transaction.controller";
import { TransactionRepository } from "./transaction.repository";
import { registerTransactionRoutes } from "./transaction.routes";
import { TransactionService } from "./transaction.service";

export function registerTransactionModule(app: FastifyInstance, db: Database) {
  const productRepository = new ProductRepository(db);
  const walletRepository = new WalletRepository(db);
  const repository = new TransactionRepository(db, productRepository, walletRepository);
  const service = new TransactionService(repository);
  const controller = new TransactionController(service);

  registerTransactionRoutes(app, controller);
}

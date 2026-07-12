import type { FastifyInstance } from "fastify";
import type { Database } from "../../common/database/client";
import { ProductController } from "./product.controller";
import { ProductRepository } from "./product.repository";
import { registerProductRoutes } from "./product.routes";
import { ProductService } from "./product.service";

export function registerProductModule(app: FastifyInstance, db: Database) {
  const repository = new ProductRepository(db);
  const service = new ProductService(repository);
  const controller = new ProductController(service);

  registerProductRoutes(app, controller);
}

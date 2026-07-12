import { randomUUID } from "node:crypto";
import scalarApiReference from "@scalar/fastify-api-reference";
import compress from "@fastify/compress";
import cors from "@fastify/cors";
import formbody from "@fastify/formbody";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import Fastify, { type FastifyInstance } from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { config } from "./common/config/env";
import { db } from "./common/database/client";
import { registerBullBoard } from "./common/plugins/bull-board.plugin";
import { errorHandler } from "./common/plugins/error-handler";
import { registerHealthCheck } from "./common/plugins/health.plugin";
import { registerAuthModule } from "./modules/auth/auth.module";
import { registerProductModule } from "./modules/product/product.module";
import { registerTransactionModule } from "./modules/transaction/transaction.module";
import { registerWalletModule } from "./modules/wallet/wallet.module";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
    // Accepts an inbound `x-request-id` from an upstream proxy/gateway (so a trace stays
    // correlated across services); generates a UUID when the caller doesn't send one.
    requestIdHeader: "x-request-id",
    genReqId: () => randomUUID(),
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler(errorHandler);

  // Echoed on every response (success or error) so callers/support can quote it back to us,
  // and it's what error.requestId / GlitchTip / log lines are correlated against.
  app.addHook("onRequest", async (request, reply) => {
    reply.header("x-request-id", request.id);
  });

  await app.register(helmet, {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // Scalar's docs page bootstraps itself with an inline <script> we control ourselves.
        scriptSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  });
  await app.register(cors, { origin: config.app.corsOrigin });
  await app.register(rateLimit, config.security.rateLimit.global);
  await app.register(compress);
  await app.register(formbody);
  await app.register(jwt, { secret: config.auth.secretKey });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Marketplace API",
        description: "Rest API for marketplace",
        version: "2.0.0",
      },
      servers: [{ url: "/api" }],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(scalarApiReference, {
    routePrefix: "/api/docs",
    configuration: {
      theme: "purple",
    },
  });

  await registerHealthCheck(app);

  await app.register(
    async (api) => {
      await api.register(async (authApi) => registerAuthModule(authApi, db), { prefix: "/auth" });
      await api.register(async (productApi) => registerProductModule(productApi, db), {
        prefix: "/products",
      });
      await api.register(async (walletApi) => registerWalletModule(walletApi, db), {
        prefix: "/wallets",
      });
      await api.register(async (transactionApi) => registerTransactionModule(transactionApi, db), {
        prefix: "/transactions",
      });
      await registerBullBoard(api);
    },
    { prefix: "/api" },
  );

  return app;
}

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { HttpStatus } from "../../common/constants/http-status";
import { authGuard } from "../../common/plugins/auth.guard";
import { requireRole } from "../../common/plugins/role.guard";
import { guardedErrorResponses, successResponseSchema } from "../../common/utils/openapi-schemas";
import { createTransactionSchema } from "./dto/create-transaction.dto";
import type { TransactionController } from "./transaction.controller";

const transactionResponseSchema = z.object({
  id: z.number(),
  productId: z.number(),
  userId: z.number(),
  quantity: z.number(),
  totalPrice: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const productResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  stock: z.number(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export function registerTransactionRoutes(app: FastifyInstance, controller: TransactionController) {
  const server = app.withTypeProvider<ZodTypeProvider>();
  const guard = [authGuard, requireRole("pembeli")];

  server.get(
    "/history",
    {
      preHandler: guard,
      schema: {
        tags: ["Transaction"],
        summary: "Lihat riwayat transaksi",
        response: {
          [HttpStatus.OK]: successResponseSchema(
            z.object({ rows: z.array(transactionResponseSchema), count: z.number() }),
          ),
          ...guardedErrorResponses,
        },
      },
    },
    controller.getHistory,
  );

  server.post(
    "/create",
    {
      preHandler: guard,
      schema: {
        tags: ["Transaction"],
        summary: "Buat transaksi pembelian",
        body: createTransactionSchema,
        response: {
          [HttpStatus.OK]: successResponseSchema(
            z.object({ product: productResponseSchema, transaction: transactionResponseSchema }),
          ),
          ...guardedErrorResponses,
        },
      },
    },
    controller.createTransaction,
  );
}

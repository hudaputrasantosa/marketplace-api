import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { HttpStatus } from "../../common/constants/http-status";
import { authGuard } from "../../common/plugins/auth.guard";
import { requireRole } from "../../common/plugins/role.guard";
import { guardedErrorResponses, successResponseSchema } from "../../common/utils/openapi-schemas";
import { balanceSchema } from "./dto/balance.dto";
import { createWalletSchema } from "./dto/create-wallet.dto";
import type { WalletController } from "./wallet.controller";

const walletResponseSchema = z.object({
  id: z.number(),
  userId: z.number(),
  idNumber: z.string(),
  balance: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export function registerWalletRoutes(app: FastifyInstance, controller: WalletController) {
  const server = app.withTypeProvider<ZodTypeProvider>();
  const guard = [authGuard, requireRole("pembeli")];

  server.get(
    "/detail",
    {
      preHandler: guard,
      schema: {
        tags: ["Wallet"],
        summary: "Lihat detail dompet user",
        response: {
          [HttpStatus.OK]: successResponseSchema(walletResponseSchema),
          ...guardedErrorResponses,
        },
      },
    },
    controller.getWallet,
  );

  server.post(
    "/create",
    {
      preHandler: guard,
      schema: {
        tags: ["Wallet"],
        summary: "Buat dompet baru",
        body: createWalletSchema,
        response: {
          [HttpStatus.CREATED]: successResponseSchema(walletResponseSchema),
          ...guardedErrorResponses,
        },
      },
    },
    controller.createWallet,
  );

  server.post(
    "/deposit",
    {
      preHandler: guard,
      schema: {
        tags: ["Wallet"],
        summary: "Setor saldo ke dompet",
        body: balanceSchema,
        response: {
          [HttpStatus.OK]: successResponseSchema(z.object({ wallet: walletResponseSchema })),
          ...guardedErrorResponses,
        },
      },
    },
    controller.deposit,
  );

  server.post(
    "/withdraw",
    {
      preHandler: guard,
      schema: {
        tags: ["Wallet"],
        summary: "Tarik saldo dari dompet",
        body: balanceSchema,
        response: {
          [HttpStatus.OK]: successResponseSchema(z.object({ wallet: walletResponseSchema })),
          ...guardedErrorResponses,
        },
      },
    },
    controller.withdraw,
  );
}

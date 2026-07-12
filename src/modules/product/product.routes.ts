import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { HttpStatus } from "../../common/constants/http-status";
import { authGuard } from "../../common/plugins/auth.guard";
import { requireRole } from "../../common/plugins/role.guard";
import { guardedErrorResponses, successResponseSchema } from "../../common/utils/openapi-schemas";
import { createProductSchema } from "./dto/create-product.dto";
import { productParamsSchema } from "./dto/product-params.dto";
import { updateProductSchema } from "./dto/update-product.dto";
import type { ProductController } from "./product.controller";

const productResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  stock: z.number(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export function registerProductRoutes(app: FastifyInstance, controller: ProductController) {
  const server = app.withTypeProvider<ZodTypeProvider>();
  const guard = [authGuard, requireRole("admin")];

  server.get(
    "/",
    {
      preHandler: guard,
      schema: {
        tags: ["Product"],
        summary: "Lihat semua produk",
        response: {
          [HttpStatus.OK]: successResponseSchema(z.array(productResponseSchema)),
          ...guardedErrorResponses,
        },
      },
    },
    controller.listProducts,
  );

  server.get(
    "/:id",
    {
      preHandler: guard,
      schema: {
        tags: ["Product"],
        summary: "Lihat detail 1 produk",
        params: productParamsSchema,
        response: {
          [HttpStatus.OK]: successResponseSchema(productResponseSchema),
          ...guardedErrorResponses,
        },
      },
    },
    controller.getProduct,
  );

  server.post(
    "/create",
    {
      preHandler: guard,
      schema: {
        tags: ["Product"],
        summary: "Tambah produk baru",
        body: createProductSchema,
        response: {
          [HttpStatus.CREATED]: successResponseSchema(productResponseSchema),
          ...guardedErrorResponses,
        },
      },
    },
    controller.createProduct,
  );

  server.put(
    "/update/:id",
    {
      preHandler: guard,
      schema: {
        tags: ["Product"],
        summary: "Update data produk",
        params: productParamsSchema,
        body: updateProductSchema,
        response: { [HttpStatus.CREATED]: successResponseSchema(), ...guardedErrorResponses },
      },
    },
    controller.updateProduct,
  );

  server.delete(
    "/delete/:id",
    {
      preHandler: guard,
      schema: {
        tags: ["Product"],
        summary: "Hapus produk",
        params: productParamsSchema,
        response: { [HttpStatus.OK]: successResponseSchema(), ...guardedErrorResponses },
      },
    },
    controller.deleteProduct,
  );
}

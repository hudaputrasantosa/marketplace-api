import { z } from "zod";

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().int().nonnegative("Price is numeric").optional(),
  description: z.string().min(1).optional(),
  stock: z.number().int().nonnegative("Stock is numeric").optional(),
});

export type UpdateProductDto = z.infer<typeof updateProductSchema>;

import { z } from "zod";

export const createTransactionSchema = z.object({
  productId: z.number().int("productId is required and numeric"),
  quantity: z.number().int("quantity is required and numeric"),
});

export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;

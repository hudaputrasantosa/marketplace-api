import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().int().nonnegative("Price is required and numeric"),
  description: z.string().min(1, "Description is required"),
  stock: z.number().int().nonnegative("Stock is required and numeric"),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;

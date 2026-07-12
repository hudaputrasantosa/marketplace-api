import { z } from "zod";

export const productParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type ProductParamsDto = z.infer<typeof productParamsSchema>;

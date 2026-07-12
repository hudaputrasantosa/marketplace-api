import { z } from "zod";

export const createWalletSchema = z.object({
  idNumber: z
    .string()
    .min(16, "idNumber is required and numeric")
    .regex(/^[0-9]+$/, "idNumber is required and numeric"),
  balance: z.number().int().nonnegative("Balance is required and numeric").optional(),
});

export type CreateWalletDto = z.infer<typeof createWalletSchema>;

import { z } from "zod";

export const balanceSchema = z.object({
  balance: z.number().int("Balance is required and numeric"),
});

export type BalanceDto = z.infer<typeof balanceSchema>;

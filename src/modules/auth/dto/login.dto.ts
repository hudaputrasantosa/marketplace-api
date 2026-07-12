import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Please include a valid email").email("Please include a valid email"),
  password: z.string().min(8, "Password must be 8 or more characters"),
});

export type LoginDto = z.infer<typeof loginSchema>;

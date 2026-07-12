import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.enum(["admin", "pembeli"], {
    errorMap: () => ({ message: "Role is required" }),
  }),
  email: z.string().min(1, "Please include a valid email").email("Please include a valid email"),
  password: z
    .string()
    .min(8, "Password must be 8 or more characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9]+$/,
      "Password must be 8 or more characters",
    ),
});

export type RegisterDto = z.infer<typeof registerSchema>;

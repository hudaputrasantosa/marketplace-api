import "@fastify/jwt";

export type Role = "admin" | "pembeli";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: number; role: Role };
    user: { id: number; role: Role };
  }
}

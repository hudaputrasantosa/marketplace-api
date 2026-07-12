import bcrypt from "bcryptjs";
import { describe, expect, it, mock } from "bun:test";
import { createTestApp, signTestToken, type TestApp } from "../../common/testing/test-app";
import { AuthController } from "./auth.controller";
import { registerAuthRoutes } from "./auth.routes";
import { AuthService } from "./auth.service";
import type { IAuthRepository } from "./interfaces/auth.interface";

function buildRepo(overrides: Partial<IAuthRepository> = {}): IAuthRepository {
  return {
    findByEmail: mock(async () => undefined),
    create: mock(async () => {}),
    ...overrides,
  };
}

async function buildApp(repository: IAuthRepository): Promise<TestApp> {
  const service = new AuthService(repository as never);
  const controller = new AuthController(service);
  return createTestApp("/api/auth", (api) => registerAuthRoutes(api, controller));
}

describe("auth module", () => {
  describe("POST /api/auth/register", () => {
    it("returns 400 when body is invalid", async () => {
      const app = await buildApp(buildRepo());
      const res = await app.inject({ method: "POST", url: "/api/auth/register", payload: {} });
      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 409 when email already registered", async () => {
      const repo = buildRepo({
        findByEmail: mock(async () => ({
          id: 1,
          name: "Existing",
          role: "pembeli" as const,
          email: "user@test.com",
          password: await bcrypt.hash("Password123", 8),
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      });
      const app = await buildApp(repo);
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: { name: "User", role: "pembeli", email: "user@test.com", password: "Password123" },
      });
      expect(res.statusCode).toBe(409);
    });

    it("returns 201 on success", async () => {
      const app = await buildApp(buildRepo());
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: { name: "User", role: "pembeli", email: "new@test.com", password: "Password123" },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().success).toBe(true);
    });
  });

  describe("POST /api/auth/login", () => {
    it("returns 401 when email not found", async () => {
      const app = await buildApp(buildRepo());
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email: "missing@test.com", password: "Password123" },
      });
      expect(res.statusCode).toBe(401);
    });

    it("returns 200 with a token on success", async () => {
      const repo = buildRepo({
        findByEmail: mock(async () => ({
          id: 1,
          name: "User",
          role: "admin" as const,
          email: "user@test.com",
          password: await bcrypt.hash("Password123", 8),
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      });
      const app = await buildApp(repo);
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email: "user@test.com", password: "Password123" },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.token).toBeString();
      expect(res.json().data.user.name).toBe("User");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("returns 401 without a token", async () => {
      const app = await buildApp(buildRepo());
      const res = await app.inject({ method: "POST", url: "/api/auth/logout" });
      expect(res.statusCode).toBe(401);
    });

    it("returns 403 with an invalid token", async () => {
      const app = await buildApp(buildRepo());
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/logout",
        headers: { authorization: "Bearer invalid-token" },
      });
      expect(res.statusCode).toBe(403);
    });

    it("returns 200 with a valid token", async () => {
      const app = await buildApp(buildRepo());
      const token = signTestToken(app, { id: 1, role: "admin" });
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/logout",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
    });
  });
});

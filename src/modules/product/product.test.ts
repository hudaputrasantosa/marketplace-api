import { describe, expect, it, mock } from "bun:test";
import type { Product } from "../../common/database/schema";
import { createTestApp, signTestToken, type TestApp } from "../../common/testing/test-app";
import type { IProductRepository } from "./interfaces/product.interface";
import { ProductController } from "./product.controller";
import { registerProductRoutes } from "./product.routes";
import { ProductService } from "./product.service";

const SAMPLE_PRODUCT: Product = {
  id: 1,
  name: "Kaos",
  price: 50_000,
  stock: 10,
  description: "Kaos polos",
  createdAt: new Date(),
  updatedAt: new Date(),
};

function buildRepo(overrides: Partial<IProductRepository> = {}): IProductRepository {
  return {
    findAll: mock(async () => []),
    findById: mock(async () => undefined),
    findByIdForUpdate: mock(async () => undefined),
    create: mock(async () => SAMPLE_PRODUCT),
    update: mock(async () => {}),
    remove: mock(async () => false),
    ...overrides,
  };
}

async function buildApp(repository: IProductRepository): Promise<TestApp> {
  const service = new ProductService(repository as never);
  const controller = new ProductController(service);
  return createTestApp("/api/products", (api) => registerProductRoutes(api, controller));
}

describe("product module", () => {
  it("returns 401 without a token", async () => {
    const app = await buildApp(buildRepo());
    const res = await app.inject({ method: "GET", url: "/api/products/1" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 409 when role is not admin", async () => {
    const app = await buildApp(buildRepo());
    const token = signTestToken(app, { id: 1, role: "pembeli" });
    const res = await app.inject({
      method: "GET",
      url: "/api/products/1",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(409);
  });

  it("returns 400 when creating with an invalid body", async () => {
    const app = await buildApp(buildRepo());
    const token = signTestToken(app, { id: 1, role: "admin" });
    const res = await app.inject({
      method: "POST",
      url: "/api/products/create",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 201 when creating a produk", async () => {
    const app = await buildApp(buildRepo());
    const token = signTestToken(app, { id: 1, role: "admin" });
    const res = await app.inject({
      method: "POST",
      url: "/api/products/create",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "Kaos", price: 50_000, description: "Kaos polos", stock: 10 },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.name).toBe("Kaos");
  });

  it("returns 404 when produk is not found", async () => {
    const app = await buildApp(buildRepo());
    const token = signTestToken(app, { id: 1, role: "admin" });
    const res = await app.inject({
      method: "GET",
      url: "/api/products/999",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it("returns 200 when produk is found", async () => {
    const app = await buildApp(buildRepo({ findById: mock(async () => SAMPLE_PRODUCT) }));
    const token = signTestToken(app, { id: 1, role: "admin" });
    const res = await app.inject({
      method: "GET",
      url: "/api/products/1",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.id).toBe(1);
  });
});

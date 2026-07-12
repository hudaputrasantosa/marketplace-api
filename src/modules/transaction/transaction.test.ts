import { describe, expect, it, mock } from "bun:test";
import type { Product, Transaction } from "../../common/database/schema";
import { createTestApp, signTestToken, type TestApp } from "../../common/testing/test-app";
import type {
  ITransactionRepository,
  TransactionPurchaseResult,
} from "./interfaces/transaction.interface";
import { TransactionController } from "./transaction.controller";
import { registerTransactionRoutes } from "./transaction.routes";
import { TransactionService } from "./transaction.service";

const SAMPLE_PRODUCT: Product = {
  id: 1,
  name: "Kaos",
  price: 50_000,
  stock: 9,
  description: "Kaos polos",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const SAMPLE_TRANSACTION: Transaction = {
  id: 1,
  productId: 1,
  userId: 1,
  quantity: 1,
  totalPrice: 50_000,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function buildRepo(overrides: Partial<ITransactionRepository> = {}): ITransactionRepository {
  return {
    findAllByUser: mock(async () => []),
    findById: mock(async () => undefined),
    purchase: mock(
      async (): Promise<TransactionPurchaseResult> => ({ ok: false, reason: "stock" }),
    ),
    ...overrides,
  };
}

async function buildApp(repository: ITransactionRepository): Promise<TestApp> {
  const service = new TransactionService(repository as never);
  const controller = new TransactionController(service);
  return createTestApp("/api/transactions", (api) => registerTransactionRoutes(api, controller));
}

describe("transaction module", () => {
  it("returns 401 without a token", async () => {
    const app = await buildApp(buildRepo());
    const res = await app.inject({ method: "GET", url: "/api/transactions/history" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 409 when role is not pembeli", async () => {
    const app = await buildApp(buildRepo());
    const token = signTestToken(app, { id: 1, role: "admin" });
    const res = await app.inject({
      method: "GET",
      url: "/api/transactions/history",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(409);
  });

  it("returns 200 with an empty history", async () => {
    const app = await buildApp(buildRepo());
    const token = signTestToken(app, { id: 1, role: "pembeli" });
    const res = await app.inject({
      method: "GET",
      url: "/api/transactions/history",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.count).toBe(0);
  });

  it("returns 400 when body is invalid", async () => {
    const app = await buildApp(buildRepo());
    const token = signTestToken(app, { id: 1, role: "pembeli" });
    const res = await app.inject({
      method: "POST",
      url: "/api/transactions/create",
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 409 when stock is insufficient", async () => {
    const app = await buildApp(buildRepo());
    const token = signTestToken(app, { id: 1, role: "pembeli" });
    const res = await app.inject({
      method: "POST",
      url: "/api/transactions/create",
      headers: { authorization: `Bearer ${token}` },
      payload: { productId: 1, quantity: 100 },
    });
    expect(res.statusCode).toBe(409);
  });

  it("returns 409 when balance is insufficient", async () => {
    const app = await buildApp(
      buildRepo({ purchase: mock(async () => ({ ok: false, reason: "balance" }) as const) }),
    );
    const token = signTestToken(app, { id: 1, role: "pembeli" });
    const res = await app.inject({
      method: "POST",
      url: "/api/transactions/create",
      headers: { authorization: `Bearer ${token}` },
      payload: { productId: 1, quantity: 1 },
    });
    expect(res.statusCode).toBe(409);
  });

  it("returns 200 on a successful purchase", async () => {
    const app = await buildApp(
      buildRepo({
        purchase: mock(
          async () =>
            ({ ok: true, product: SAMPLE_PRODUCT, transaction: SAMPLE_TRANSACTION }) as const,
        ),
      }),
    );
    const token = signTestToken(app, { id: 1, role: "pembeli" });
    const res = await app.inject({
      method: "POST",
      url: "/api/transactions/create",
      headers: { authorization: `Bearer ${token}` },
      payload: { productId: 1, quantity: 1 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.transaction.totalPrice).toBe(50_000);
  });
});

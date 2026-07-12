import { describe, expect, it, mock } from "bun:test";
import type { Wallet } from "../../common/database/schema";
import { createTestApp, signTestToken, type TestApp } from "../../common/testing/test-app";
import type { IWalletRepository } from "./interfaces/wallet.interface";
import { WalletController } from "./wallet.controller";
import { registerWalletRoutes } from "./wallet.routes";
import { WalletService } from "./wallet.service";

const SAMPLE_WALLET: Wallet = {
  id: 1,
  userId: 1,
  idNumber: "1234567890123456",
  balance: 50_000,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function buildRepo(overrides: Partial<IWalletRepository> = {}): IWalletRepository {
  return {
    findByUserId: mock(async () => undefined),
    findByUserIdForUpdate: mock(async () => undefined),
    create: mock(async () => SAMPLE_WALLET),
    updateBalance: mock(async () => SAMPLE_WALLET),
    ...overrides,
  };
}

async function buildApp(repository: IWalletRepository): Promise<TestApp> {
  const service = new WalletService(repository as never);
  const controller = new WalletController(service);
  return createTestApp("/api/wallets", (api) => registerWalletRoutes(api, controller));
}

describe("wallet module", () => {
  it("returns 401 without a token", async () => {
    const app = await buildApp(buildRepo());
    const res = await app.inject({ method: "GET", url: "/api/wallets/detail" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 409 when role is not pembeli", async () => {
    const app = await buildApp(buildRepo());
    const token = signTestToken(app, { id: 1, role: "admin" });
    const res = await app.inject({
      method: "GET",
      url: "/api/wallets/detail",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(409);
  });

  it("returns 404 when wallet does not exist", async () => {
    const app = await buildApp(buildRepo());
    const token = signTestToken(app, { id: 1, role: "pembeli" });
    const res = await app.inject({
      method: "GET",
      url: "/api/wallets/detail",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it("returns 200 when wallet exists", async () => {
    const app = await buildApp(buildRepo({ findByUserId: mock(async () => SAMPLE_WALLET) }));
    const token = signTestToken(app, { id: 1, role: "pembeli" });
    const res = await app.inject({
      method: "GET",
      url: "/api/wallets/detail",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.idNumber).toBe("1234567890123456");
  });

  it("returns 400 when idNumber is too short", async () => {
    const app = await buildApp(buildRepo());
    const token = signTestToken(app, { id: 1, role: "pembeli" });
    const res = await app.inject({
      method: "POST",
      url: "/api/wallets/create",
      headers: { authorization: `Bearer ${token}` },
      payload: { idNumber: "123" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 409 when wallet already exists on create", async () => {
    const app = await buildApp(buildRepo({ findByUserId: mock(async () => SAMPLE_WALLET) }));
    const token = signTestToken(app, { id: 1, role: "pembeli" });
    const res = await app.inject({
      method: "POST",
      url: "/api/wallets/create",
      headers: { authorization: `Bearer ${token}` },
      payload: { idNumber: "1234567890123456" },
    });
    expect(res.statusCode).toBe(409);
  });

  it("returns 404 when deposit is below minimum", async () => {
    const app = await buildApp(buildRepo({ findByUserId: mock(async () => SAMPLE_WALLET) }));
    const token = signTestToken(app, { id: 1, role: "pembeli" });
    const res = await app.inject({
      method: "POST",
      url: "/api/wallets/deposit",
      headers: { authorization: `Bearer ${token}` },
      payload: { balance: 1000 },
    });
    expect(res.statusCode).toBe(404);
  });

  it("returns 200 when deposit succeeds", async () => {
    const app = await buildApp(
      buildRepo({
        findByUserId: mock(async () => SAMPLE_WALLET),
        updateBalance: mock(async () => ({ ...SAMPLE_WALLET, balance: 60_000 })),
      }),
    );
    const token = signTestToken(app, { id: 1, role: "pembeli" });
    const res = await app.inject({
      method: "POST",
      url: "/api/wallets/deposit",
      headers: { authorization: `Bearer ${token}` },
      payload: { balance: 10_000 },
    });
    expect(res.statusCode).toBe(200);
  });

  it("returns 409 when withdraw exceeds available balance", async () => {
    const app = await buildApp(buildRepo({ findByUserId: mock(async () => SAMPLE_WALLET) }));
    const token = signTestToken(app, { id: 1, role: "pembeli" });
    const res = await app.inject({
      method: "POST",
      url: "/api/wallets/withdraw",
      headers: { authorization: `Bearer ${token}` },
      payload: { balance: 100_000 },
    });
    expect(res.statusCode).toBe(409);
  });
});

import { eq } from "drizzle-orm";
import type { Database, Executor, Transaction } from "../../common/database/client";
import { type NewWallet, type Wallet, wallets } from "../../common/database/schema";
import type { IWalletRepository } from "./interfaces/wallet.interface";

export class WalletRepository implements IWalletRepository {
  constructor(private readonly db: Database) {}

  async findByUserId(userId: number, executor: Executor = this.db): Promise<Wallet | undefined> {
    const [wallet] = await executor
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);
    return wallet;
  }

  async findByUserIdForUpdate(userId: number, executor: Executor): Promise<Wallet | undefined> {
    const [wallet] = await executor
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .for("update")
      .limit(1);
    return wallet;
  }

  async create(data: NewWallet, executor: Executor = this.db): Promise<Wallet> {
    const [result] = await executor.insert(wallets).values(data).$returningId();
    if (!result) throw new Error("Failed to insert wallet");
    const [created] = await executor
      .select()
      .from(wallets)
      .where(eq(wallets.id, result.id))
      .limit(1);
    if (!created) throw new Error("Failed to load created wallet");
    return created;
  }

  /**
   * Locks the wallet row (SELECT ... FOR UPDATE) and sets its balance to `newBalance`. Opens its
   * own transaction when called standalone (no executor); joins the caller's transaction when
   * one is passed in, so it can be composed into a larger flow (e.g. a purchase) atomically.
   */
  async updateBalance(
    userId: number,
    newBalance: number,
    executor?: Transaction,
  ): Promise<Wallet | undefined> {
    const run = async (tx: Executor) => {
      const wallet = await this.findByUserIdForUpdate(userId, tx);
      if (!wallet) return undefined;

      await tx.update(wallets).set({ balance: newBalance }).where(eq(wallets.id, wallet.id));
      return { ...wallet, balance: newBalance };
    };

    if (executor) return run(executor);
    return this.db.transaction(run);
  }
}

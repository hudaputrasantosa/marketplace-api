import type { Executor, Transaction } from "../../../common/database/client";
import type { NewWallet, Wallet } from "../../../common/database/schema";

export interface IWalletRepository {
  findByUserId(userId: number, executor?: Executor): Promise<Wallet | undefined>;
  /** Locked read (SELECT ... FOR UPDATE) - must run inside a transaction to have any effect. */
  findByUserIdForUpdate(userId: number, executor: Executor): Promise<Wallet | undefined>;
  create(data: NewWallet, executor?: Executor): Promise<Wallet>;
  /**
   * Opens its own transaction when no executor is given (standalone deposit/withdraw); joins
   * the caller's transaction instead when one is passed (e.g. composed into a larger purchase flow).
   */
  updateBalance(
    userId: number,
    newBalance: number,
    executor?: Transaction,
  ): Promise<Wallet | undefined>;
}

export interface IWalletService {
  getWallet(userId: number): Promise<Wallet>;
  createWallet(userId: number, input: { idNumber: string; balance?: number }): Promise<Wallet>;
  deposit(userId: number, amount: number): Promise<Wallet>;
  withdraw(userId: number, amount: number): Promise<Wallet>;
}

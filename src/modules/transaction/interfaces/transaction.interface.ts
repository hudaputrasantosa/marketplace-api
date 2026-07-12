import type { Executor } from "../../../common/database/client";
import type { Product, Transaction } from "../../../common/database/schema";

export type TransactionPurchaseResult =
  | { ok: true; product: Product; transaction: Transaction }
  | { ok: false; reason: "stock" | "balance" };

export interface ITransactionRepository {
  findAllByUser(userId: number, executor?: Executor): Promise<Transaction[]>;
  findById(id: number, executor?: Executor): Promise<Transaction | undefined>;
  purchase(userId: number, productId: number, quantity: number): Promise<TransactionPurchaseResult>;
}

export interface ITransactionService {
  getHistory(userId: number): Promise<{ rows: Transaction[]; count: number }>;
  createTransaction(
    userId: number,
    productId: number,
    quantity: number,
  ): Promise<{ product: Product; transaction: Transaction }>;
}

import { eq } from "drizzle-orm";
import type { Database, Executor } from "../../common/database/client";
import { type Transaction, transactions } from "../../common/database/schema";
import type { ProductRepository } from "../product/product.repository";
import type { WalletRepository } from "../wallet/wallet.repository";
import type {
  ITransactionRepository,
  TransactionPurchaseResult,
} from "./interfaces/transaction.interface";

export class TransactionRepository implements ITransactionRepository {
  constructor(
    private readonly db: Database,
    private readonly productRepository: ProductRepository,
    private readonly walletRepository: WalletRepository,
  ) {}

  async findAllByUser(userId: number, executor: Executor = this.db) {
    return executor.select().from(transactions).where(eq(transactions.userId, userId));
  }

  async findById(id: number, executor: Executor = this.db): Promise<Transaction | undefined> {
    const [transaction] = await executor
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);
    return transaction;
  }

  /**
   * Locks the product and wallet rows (SELECT ... FOR UPDATE) inside a single transaction, then
   * atomically creates the transaction record and decrements stock/balance - composing
   * ProductRepository/WalletRepository (passing the shared `tx`) rather than duplicating their
   * queries here, replacing the old `sequelize.transaction(..., { lock: true })` pattern.
   */
  async purchase(
    userId: number,
    productId: number,
    quantity: number,
  ): Promise<TransactionPurchaseResult> {
    return this.db.transaction(async (tx) => {
      const product = await this.productRepository.findByIdForUpdate(productId, tx);

      if (!product || product.stock === 0 || product.stock < quantity || quantity === 0) {
        return { ok: false, reason: "stock" } as const;
      }

      const totalPrice = product.price * quantity;

      const wallet = await this.walletRepository.findByUserIdForUpdate(userId, tx);

      if (!wallet || (wallet.balance ?? 0) <= totalPrice) {
        return { ok: false, reason: "balance" } as const;
      }

      const [insertResult] = await tx
        .insert(transactions)
        .values({ productId, userId, quantity, totalPrice })
        .$returningId();
      if (!insertResult) throw new Error("Failed to insert transaction");

      await this.walletRepository.updateBalance(userId, (wallet.balance ?? 0) - totalPrice, tx);
      await this.productRepository.update(productId, { stock: product.stock - quantity }, tx);

      const transaction = await this.findById(insertResult.id, tx);
      const updatedProduct = await this.productRepository.findById(productId, tx);

      if (!transaction || !updatedProduct) {
        throw new Error("Failed to load created transaction");
      }

      return { ok: true, product: updatedProduct, transaction } as const;
    });
  }
}

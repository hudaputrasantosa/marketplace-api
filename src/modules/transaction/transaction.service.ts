import type { Product, Transaction } from "../../common/database/schema";
import { ConflictError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import type { ITransactionService } from "./interfaces/transaction.interface";
import type { TransactionRepository } from "./transaction.repository";

export class TransactionService implements ITransactionService {
  constructor(private readonly repository: TransactionRepository) {}

  async getHistory(userId: number): Promise<{ rows: Transaction[]; count: number }> {
    const rows = await this.repository.findAllByUser(userId);
    return { rows, count: rows.length };
  }

  async createTransaction(
    userId: number,
    productId: number,
    quantity: number,
  ): Promise<{ product: Product; transaction: Transaction }> {
    const result = await this.repository.purchase(userId, productId, quantity);

    if (!result.ok) {
      if (result.reason === "stock") {
        throw new ConflictError(
          ErrorCode.INSUFFICIENT_STOCK,
          "stok tidak tersedia/kuantitas melebihi stok/kuantitas 0",
        );
      }
      throw new ConflictError(
        ErrorCode.INSUFFICIENT_BALANCE,
        "Belum mempunyai dompet atau saldo tidak memenuhi",
      );
    }

    return { product: result.product, transaction: result.transaction };
  }
}

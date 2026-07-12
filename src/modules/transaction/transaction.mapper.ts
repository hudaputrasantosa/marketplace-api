import type { Transaction } from "../../common/database/schema";

export function toTransactionResponse(transaction: Transaction) {
  return {
    id: transaction.id,
    productId: transaction.productId,
    userId: transaction.userId,
    quantity: transaction.quantity,
    totalPrice: transaction.totalPrice,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}

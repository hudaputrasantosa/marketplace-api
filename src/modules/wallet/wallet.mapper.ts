import type { Wallet } from "../../common/database/schema";

export function toWalletResponse(wallet: Wallet) {
  return {
    id: wallet.id,
    userId: wallet.userId,
    idNumber: wallet.idNumber,
    balance: wallet.balance,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
  };
}

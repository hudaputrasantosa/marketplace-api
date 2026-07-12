import type { Wallet } from "../../common/database/schema";
import { ConflictError, NotFoundError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import type { IWalletService } from "./interfaces/wallet.interface";
import type { WalletRepository } from "./wallet.repository";

const MIN_DEPOSIT_WITHDRAWAL = 10_000;

export class WalletService implements IWalletService {
  constructor(private readonly repository: WalletRepository) {}

  async getWallet(userId: number): Promise<Wallet> {
    const wallet = await this.repository.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundError(ErrorCode.WALLET_NOT_FOUND, "Dompet tidak ditemukan");
    }
    return wallet;
  }

  async createWallet(
    userId: number,
    input: { idNumber: string; balance?: number },
  ): Promise<Wallet> {
    const existing = await this.repository.findByUserId(userId);
    if (existing) {
      throw new ConflictError(ErrorCode.WALLET_ALREADY_EXISTS, "Anda sudah memiliki Dompet");
    }

    return this.repository.create({
      userId,
      idNumber: input.idNumber,
      balance: input.balance ?? 0,
    });
  }

  async deposit(userId: number, amount: number): Promise<Wallet> {
    const wallet = await this.repository.findByUserId(userId);
    if (!wallet || amount < MIN_DEPOSIT_WITHDRAWAL) {
      throw new NotFoundError(
        ErrorCode.WALLET_DEPOSIT_INVALID,
        "Anda belum mempunyai dompet/setor saldo minimal 10000",
      );
    }

    const updated = await this.repository.updateBalance(userId, (wallet.balance ?? 0) + amount);
    if (!updated) {
      throw new NotFoundError(
        ErrorCode.WALLET_DEPOSIT_INVALID,
        "Anda belum mempunyai dompet/setor saldo minimal 10000",
      );
    }
    return updated;
  }

  async withdraw(userId: number, amount: number): Promise<Wallet> {
    const wallet = await this.repository.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundError(
        ErrorCode.WALLET_NOT_FOUND,
        "Anda belum mempunyai dompet, buat terlebih dahulu!",
      );
    }

    const hasEnoughBalance = (wallet.balance ?? 0) >= amount && amount >= MIN_DEPOSIT_WITHDRAWAL;
    if (!hasEnoughBalance) {
      throw new ConflictError(
        ErrorCode.WALLET_INSUFFICIENT_BALANCE,
        "Jumlah tarik saldo tidak mencukupi saldo anda saat ini atau minimal tarik saldo 10000",
      );
    }

    const updated = await this.repository.updateBalance(userId, (wallet.balance ?? 0) - amount);
    if (!updated) {
      throw new NotFoundError(
        ErrorCode.WALLET_NOT_FOUND,
        "Anda belum mempunyai dompet, buat terlebih dahulu!",
      );
    }
    return updated;
  }
}

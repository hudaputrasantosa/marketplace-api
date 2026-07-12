import type { FastifyReply, FastifyRequest } from "fastify";
import { HttpStatus } from "../../common/constants/http-status";
import { ApiResponse } from "../../common/utils/api-response";
import type { BalanceDto } from "./dto/balance.dto";
import type { CreateWalletDto } from "./dto/create-wallet.dto";
import { toWalletResponse } from "./wallet.mapper";
import type { WalletService } from "./wallet.service";

export class WalletController {
  constructor(private readonly service: WalletService) {}

  getWallet = async (request: FastifyRequest, reply: FastifyReply) => {
    const wallet = await this.service.getWallet(request.user.id);
    return ApiResponse.success(
      reply,
      HttpStatus.OK,
      "Berhasil Mengambil data",
      toWalletResponse(wallet),
    );
  };

  createWallet = async (request: FastifyRequest, reply: FastifyReply) => {
    const { idNumber, balance } = request.body as CreateWalletDto;
    const wallet = await this.service.createWallet(request.user.id, {
      idNumber,
      balance,
    });
    return ApiResponse.success(
      reply,
      HttpStatus.CREATED,
      "Berhasil membuat dompet",
      toWalletResponse(wallet),
    );
  };

  deposit = async (request: FastifyRequest, reply: FastifyReply) => {
    const { balance } = request.body as BalanceDto;
    const wallet = await this.service.deposit(request.user.id, balance);
    return ApiResponse.success(reply, HttpStatus.OK, `Berhasil menambah saldo sebesar ${balance}`, {
      wallet: toWalletResponse(wallet),
    });
  };

  withdraw = async (request: FastifyRequest, reply: FastifyReply) => {
    const { balance } = request.body as BalanceDto;
    const wallet = await this.service.withdraw(request.user.id, balance);
    return ApiResponse.success(reply, HttpStatus.OK, `Berhasil tarik saldo sebesar ${balance}`, {
      wallet: toWalletResponse(wallet),
    });
  };
}

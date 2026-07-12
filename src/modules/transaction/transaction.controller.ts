import type { FastifyReply, FastifyRequest } from "fastify";
import { HttpStatus } from "../../common/constants/http-status";
import { ApiResponse } from "../../common/utils/api-response";
import { toProductResponse } from "../product/product.mapper";
import type { CreateTransactionDto } from "./dto/create-transaction.dto";
import { toTransactionResponse } from "./transaction.mapper";
import type { TransactionService } from "./transaction.service";

export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  getHistory = async (request: FastifyRequest, reply: FastifyReply) => {
    const { rows, count } = await this.service.getHistory(request.user.id);
    return ApiResponse.success(
      reply,
      HttpStatus.OK,
      "Berhasil Mengambil data riwayat transaksi",
      { rows: rows.map(toTransactionResponse), count },
      { total: count },
    );
  };

  createTransaction = async (request: FastifyRequest, reply: FastifyReply) => {
    const { productId, quantity } = request.body as CreateTransactionDto;
    const { product, transaction } = await this.service.createTransaction(
      request.user.id,
      productId,
      quantity,
    );
    return ApiResponse.success(reply, HttpStatus.OK, "Berhasil melakukan transaksi", {
      product: toProductResponse(product),
      transaction: toTransactionResponse(transaction),
    });
  };
}

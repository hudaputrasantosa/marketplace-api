import type { FastifyReply, FastifyRequest } from "fastify";
import { HttpStatus } from "../../common/constants/http-status";
import { ApiResponse } from "../../common/utils/api-response";
import type { CreateProductDto } from "./dto/create-product.dto";
import type { ProductParamsDto } from "./dto/product-params.dto";
import type { UpdateProductDto } from "./dto/update-product.dto";
import { toNewProduct, toProductPatch, toProductResponse } from "./product.mapper";
import type { ProductService } from "./product.service";

export class ProductController {
  constructor(private readonly service: ProductService) {}

  listProducts = async (_request: FastifyRequest, reply: FastifyReply) => {
    const products = await this.service.listProducts();
    if (products.length === 0) {
      return ApiResponse.success(reply, HttpStatus.OK, "Data Produk Kosong");
    }
    return ApiResponse.success(
      reply,
      HttpStatus.OK,
      "Berhasil Mengambil data",
      products.map(toProductResponse),
      { total: products.length },
    );
  };

  getProduct = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as ProductParamsDto;
    const product = await this.service.getProduct(id);
    return ApiResponse.success(
      reply,
      HttpStatus.OK,
      "Berhasil Mengambil data",
      toProductResponse(product),
    );
  };

  createProduct = async (request: FastifyRequest, reply: FastifyReply) => {
    const product = await this.service.createProduct(
      toNewProduct(request.body as CreateProductDto),
    );
    return ApiResponse.success(
      reply,
      HttpStatus.CREATED,
      "Berhasil menambahkan data produk",
      toProductResponse(product),
    );
  };

  updateProduct = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as ProductParamsDto;
    await this.service.updateProduct(id, toProductPatch(request.body as UpdateProductDto));
    return ApiResponse.success(reply, HttpStatus.CREATED, "Berhasil memperbaharui data produk");
  };

  deleteProduct = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as ProductParamsDto;
    await this.service.deleteProduct(id);
    return ApiResponse.success(reply, HttpStatus.OK, "Success menghapus data");
  };
}

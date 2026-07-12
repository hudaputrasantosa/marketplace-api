import type { NewProduct, Product } from "../../common/database/schema";
import { NotFoundError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import type { IProductService } from "./interfaces/product.interface";
import type { ProductRepository } from "./product.repository";

export class ProductService implements IProductService {
  constructor(private readonly repository: ProductRepository) {}

  async listProducts(): Promise<Product[]> {
    return this.repository.findAll();
  }

  async getProduct(id: number): Promise<Product> {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new NotFoundError(ErrorCode.PRODUCT_NOT_FOUND, "Data Produk tidak ditemukan");
    }
    return product;
  }

  async createProduct(input: NewProduct): Promise<Product> {
    return this.repository.create(input);
  }

  async updateProduct(id: number, input: Partial<NewProduct>): Promise<void> {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new NotFoundError(ErrorCode.PRODUCT_NOT_FOUND, "Data Produk tidak ditemukan");
    }

    const patch = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    ) as Partial<NewProduct>;

    await this.repository.update(id, patch);
  }

  async deleteProduct(id: number): Promise<void> {
    const deleted = await this.repository.remove(id);
    if (!deleted) {
      throw new NotFoundError(
        ErrorCode.PRODUCT_NOT_FOUND,
        "Gagal menghapus data karena data tidak ditemukan",
      );
    }
  }
}

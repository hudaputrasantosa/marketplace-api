import type { Executor } from "../../../common/database/client";
import type { NewProduct, Product } from "../../../common/database/schema";

export interface IProductRepository {
  findAll(executor?: Executor): Promise<Product[]>;
  findById(id: number, executor?: Executor): Promise<Product | undefined>;
  /** Locked read (SELECT ... FOR UPDATE) - must run inside a transaction to have any effect. */
  findByIdForUpdate(id: number, executor: Executor): Promise<Product | undefined>;
  create(data: NewProduct, executor?: Executor): Promise<Product>;
  update(id: number, data: Partial<NewProduct>, executor?: Executor): Promise<void>;
  remove(id: number, executor?: Executor): Promise<boolean>;
}

export interface IProductService {
  listProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product>;
  createProduct(data: NewProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<NewProduct>): Promise<void>;
  deleteProduct(id: number): Promise<void>;
}

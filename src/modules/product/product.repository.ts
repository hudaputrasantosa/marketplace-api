import { eq } from "drizzle-orm";
import type { Database, Executor } from "../../common/database/client";
import { type NewProduct, type Product, products } from "../../common/database/schema";
import type { IProductRepository } from "./interfaces/product.interface";

export class ProductRepository implements IProductRepository {
  constructor(private readonly db: Database) {}

  async findAll(executor: Executor = this.db): Promise<Product[]> {
    return executor.select().from(products);
  }

  async findById(id: number, executor: Executor = this.db): Promise<Product | undefined> {
    const [product] = await executor.select().from(products).where(eq(products.id, id)).limit(1);
    return product;
  }

  async findByIdForUpdate(id: number, executor: Executor): Promise<Product | undefined> {
    const [product] = await executor
      .select()
      .from(products)
      .where(eq(products.id, id))
      .for("update")
      .limit(1);
    return product;
  }

  async create(data: NewProduct, executor: Executor = this.db): Promise<Product> {
    const [result] = await executor.insert(products).values(data).$returningId();
    if (!result) throw new Error("Failed to insert product");
    const created = await this.findById(result.id, executor);
    if (!created) throw new Error("Failed to load created product");
    return created;
  }

  async update(id: number, data: Partial<NewProduct>, executor: Executor = this.db): Promise<void> {
    await executor.update(products).set(data).where(eq(products.id, id));
  }

  async remove(id: number, executor: Executor = this.db): Promise<boolean> {
    const [result] = await executor.delete(products).where(eq(products.id, id));
    return result.affectedRows > 0;
  }
}

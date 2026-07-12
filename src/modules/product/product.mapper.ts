import type { NewProduct, Product } from "../../common/database/schema";
import type { CreateProductDto } from "./dto/create-product.dto";
import type { UpdateProductDto } from "./dto/update-product.dto";

export function toProductResponse(product: Product) {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    stock: product.stock,
    description: product.description,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function toNewProduct(dto: CreateProductDto): NewProduct {
  return {
    name: dto.name,
    price: dto.price,
    stock: dto.stock,
    description: dto.description,
  };
}

export function toProductPatch(dto: UpdateProductDto): Partial<NewProduct> {
  const patch: Partial<NewProduct> = {};
  if (dto.name !== undefined) patch.name = dto.name;
  if (dto.price !== undefined) patch.price = dto.price;
  if (dto.stock !== undefined) patch.stock = dto.stock;
  if (dto.description !== undefined) patch.description = dto.description;
  return patch;
}

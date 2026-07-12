import { int, mysqlTable, timestamp } from "drizzle-orm/mysql-core";

export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("product_id").notNull(),
  userId: int("user_id").notNull(),
  quantity: int("quantity").notNull(),
  totalPrice: int("total_price").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

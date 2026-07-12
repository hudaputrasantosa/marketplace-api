import { relations } from "drizzle-orm";
import { products } from "./product.schema";
import { transactions } from "./transaction.schema";
import { users } from "./user.schema";
import { wallets } from "./wallet.schema";

export const usersRelations = relations(users, ({ many, one }) => ({
  transactions: many(transactions),
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  transactions: many(transactions),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  product: one(products, {
    fields: [transactions.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

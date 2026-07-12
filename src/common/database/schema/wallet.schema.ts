import { int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  idNumber: varchar("id_number", { length: 255 }).notNull(),
  balance: int("balance").default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;

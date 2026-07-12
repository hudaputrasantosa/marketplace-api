import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "mysql",
  schema: "./src/common/database/schema/index.ts",
  out: "./database/migrations",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      `mysql://${process.env.DB_USERNAME ?? "root"}:${process.env.DB_PASSWORD ?? ""}@${
        process.env.DB_HOST ?? "127.0.0.1"
      }:${process.env.DB_PORT ?? "3306"}/${process.env.DB_NAME ?? "db_market"}`,
  },
});

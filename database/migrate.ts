import { migrate } from "drizzle-orm/mysql2/migrator";
import { db, pool } from "../src/common/database/client";
import { logger } from "../src/common/logger/logger";

async function main() {
  await migrate(db, { migrationsFolder: "database/migrations" });
  logger.info("Migrations applied successfully");
  console.log("Migrations applied successfully");
  await pool.end();
}

main().catch((error) => {
  logger.error(`Migration failed: ${error}`);
  console.error("Migration failed:", error);
  process.exit(1);
});

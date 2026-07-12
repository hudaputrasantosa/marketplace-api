import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, pool } from "../src/common/database/client";
import { users } from "../src/common/database/schema";
import { logger } from "../src/common/logger/logger";

const SEED_USERS = [
  {
    name: "Huda Putra Santosa",
    role: "admin" as const,
    email: "admin@gmail.com",
    password: "admin1234",
  },
  { name: "Nini", role: "pembeli" as const, email: "nini@gmail.com", password: "nini1234" },
];

async function main() {
  for (const seedUser of SEED_USERS) {
    const email = seedUser.email.toLowerCase();
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      console.log(`Skipping existing user ${email}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(seedUser.password, 8);
    await db.insert(users).values({
      name: seedUser.name,
      role: seedUser.role,
      email,
      password: hashedPassword,
    });
    console.log(`Seeded user ${email}`);
  }

  logger.info("Seed completed successfully");
  await pool.end();
}

main().catch((error) => {
  logger.error(`Seed failed: ${error}`);
  console.error("Seed failed:", error);
  process.exit(1);
});

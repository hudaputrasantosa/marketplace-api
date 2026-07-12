import { eq } from "drizzle-orm";
import type { Database, Executor } from "../../common/database/client";
import { type NewUser, type User, users } from "../../common/database/schema";
import type { IAuthRepository } from "./interfaces/auth.interface";

export class AuthRepository implements IAuthRepository {
  constructor(private readonly db: Database) {}

  async findByEmail(email: string, executor: Executor = this.db): Promise<User | undefined> {
    const [user] = await executor.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async create(data: NewUser, executor: Executor = this.db): Promise<void> {
    await executor.insert(users).values(data);
  }
}

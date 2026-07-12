import type { Executor } from "../../../common/database/client";
import type { NewUser, User } from "../../../common/database/schema";

export interface IAuthRepository {
  findByEmail(email: string, executor?: Executor): Promise<User | undefined>;
  create(data: NewUser, executor?: Executor): Promise<void>;
}

export interface IAuthService {
  register(input: {
    name: string;
    role: "admin" | "pembeli";
    email: string;
    password: string;
  }): Promise<void>;
  login(input: { email: string; password: string }): Promise<{ user: User }>;
}

export interface AuthTokenPayload {
  id: number;
  role: "admin" | "pembeli";
}

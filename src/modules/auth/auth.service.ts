import bcrypt from "bcryptjs";
import type { User } from "../../common/database/schema";
import { ConflictError, UnauthorizedError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import type { AuthRepository } from "./auth.repository";
import type { RegisterDto } from "./dto/register.dto";
import type { LoginDto } from "./dto/login.dto";
import type { IAuthService } from "./interfaces/auth.interface";

const SALT_ROUNDS = 8;

export class AuthService implements IAuthService {
  constructor(private readonly repository: AuthRepository) {}

  async register(input: RegisterDto): Promise<void> {
    const email = input.email.toLowerCase();
    const existing = await this.repository.findByEmail(email);
    if (existing) {
      throw new ConflictError(ErrorCode.EMAIL_ALREADY_USED, "Email sudah digunakan pada sistem");
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
    await this.repository.create({
      name: input.name,
      role: input.role,
      email,
      password: hashedPassword,
    });
  }

  async login(input: LoginDto): Promise<{ user: User }> {
    const user = await this.repository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError(ErrorCode.INVALID_CREDENTIALS, "Email Invalid");
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError(ErrorCode.INVALID_CREDENTIALS, "Invalid Password");
    }

    return { user };
  }
}

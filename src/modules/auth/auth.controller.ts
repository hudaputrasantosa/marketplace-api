import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "../../common/config/env";
import { HttpStatus } from "../../common/constants/http-status";
import { ApiResponse } from "../../common/utils/api-response";
import { toUserResponse } from "./auth.mapper";
import type { AuthService } from "./auth.service";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = async (request: FastifyRequest, reply: FastifyReply) => {
    await this.service.register(request.body as RegisterDto);
    return ApiResponse.success(reply, HttpStatus.CREATED, "Berhasil Mendaftar");
  };

  login = async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = await this.service.login(request.body as LoginDto);
    const token = await reply.jwtSign(
      { id: user.id, role: user.role },
      { expiresIn: config.auth.jwtExpiresIn },
    );

    return ApiResponse.success(reply, HttpStatus.OK, "Berhasil Masuk sistem", {
      token,
      user: toUserResponse(user),
    });
  };

  logout = async (_request: FastifyRequest, reply: FastifyReply) => {
    return ApiResponse.success(reply, HttpStatus.OK, "Berhasil keluar sistem");
  };
}

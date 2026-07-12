import jwtPlugin from "@fastify/jwt";
import Fastify, { type FastifyInstance } from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { config } from "../config/env";
import { errorHandler } from "../plugins/error-handler";
import type { Role } from "../types/fastify";

export interface InjectOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  payload?: unknown;
}

export interface InjectResponse {
  statusCode: number;
  body: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- parsed body shape is test-specific
  json: () => any;
}

export interface TestApp {
  app: FastifyInstance;
  inject(options: InjectOptions): Promise<InjectResponse>;
  close(): Promise<void>;
}

/**
 * Builds a minimal Fastify instance for testing a single module's routes in isolation.
 * Uses a real listening server + fetch() rather than Fastify's `.inject()`, since
 * light-my-request currently breaks under Bun (double writeHead on the mocked response).
 */
export async function createTestApp(
  prefix: string,
  register: (app: FastifyInstance) => void | Promise<void>,
): Promise<TestApp> {
  const app = Fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler(errorHandler);
  await app.register(jwtPlugin, { secret: config.auth.secretKey });
  await app.register(async (api) => register(api), { prefix });
  await app.ready();

  const address = await app.listen({ port: 0, host: "127.0.0.1" });

  return {
    app,
    async inject({ method, url, headers, payload }) {
      const response = await fetch(`${address}${url}`, {
        method,
        headers:
          payload !== undefined ? { "content-type": "application/json", ...headers } : headers,
        body: payload !== undefined ? JSON.stringify(payload) : undefined,
      });
      const body = await response.text();
      return {
        statusCode: response.status,
        body,
        json: () => JSON.parse(body),
      };
    },
    close: () => app.close(),
  };
}

export function signTestToken(testApp: TestApp, payload: { id: number; role: Role }): string {
  return testApp.app.jwt.sign(payload);
}

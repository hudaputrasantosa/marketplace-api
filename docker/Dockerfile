FROM oven/bun:1-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
# --production skips devDependencies (drizzle-kit, typescript, eslint, biome, husky, ...) -
# none of them are needed to run `bun src/main.ts`. --ignore-scripts skips the "prepare": "husky"
# lifecycle hook, which needs a .git directory that isn't present in the build context.
RUN bun install --production --frozen-lockfile --ignore-scripts

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY database ./database
# pino's file transports append to these paths and don't create the parent directory themselves.
RUN mkdir -p logs
EXPOSE 8080
CMD ["bun", "src/main.ts"]

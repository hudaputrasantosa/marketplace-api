# REST API Marketplace
![Logo](https://raw.githubusercontent.com/hudaputrasantosa/marketplace-api/master/diagram.png)


## ⚡ Deskripsi
REST API Marketplace merupakan aplikasi backend yang menyediakan endpoint dengan tujuan untuk memberikan komunikasi kepada frontend developer untuk melakukan konsumsi API pada sisi klien sistem pengelolaan produk, dan transaksi pembelian produk oleh user.

## ✨ Entitas
- User ['admin', 'pembeli']
- Produk
- Transaksi
- Dompet

## ✨ Endpoints
![Logo](https://raw.githubusercontent.com/hudaputrasantosa/marketplace-api/master/document-api.png)
Base URL : http://localhost:8080/api/
URL Docs (Scalar) : http://localhost:8080/api/docs

| Method   | Url/Endpoint   | Action   |
| ------------- | ------------- | -------- |
| POST      | /auth/register       | Daftar Akun |
| POST      | /auth/login | Masuk Sistem |
| POST      | /auth/logout       | Keluar sistem  |
| GET      | /products      | lihat semua data produk |
| GET      | /products/{id}     | lihat 1 data produk  |
| POST      | /products/create       | membuat produk  |
| PUT      | /products/update/{id}      | memperbaharui produk |
| DELETE      | /products/delete/{id}     | menghapus produk  |
| GET      | /wallets/detail     | melihat detail dompet  |
| POST      | /wallets/create     | membuat dompet  |
| POST      | /wallets/deposit     | setor saldo  |
| POST      | /wallets/withdraw    | tarik saldo  |
| GET      | /transactions/history    | melihat riwayat transaksi |
| POST      | /transactions/create    | membuat transaksi  |

## ✅ Tech Stack
- **Bun** — runtime, menjalankan `.ts` langsung tanpa build step
- **TypeScript** (strict mode)
- **Fastify v4** — web framework
- **Drizzle ORM** + **MySQL** — database
- **Zod** (`fastify-type-provider-zod`) — validasi request sekaligus generate dokumentasi OpenAPI
- **@fastify/jwt** — autentikasi
- **@fastify/swagger** + **Scalar** — dokumentasi API di `/api/docs`
- **ioredis** — cache
- **amqplib/RabbitMQ** — message broker
- **BullMQ** — background jobs
- **GlitchTip** (Sentry-compatible) + **OpenTelemetry** — observability
- **bun test** — testing
- **Biome** (format) + **ESLint** (lint)
- **Docker** + **Docker Compose** — containerization

## 🔥 Instalasi & Menjalankan (Local Dev)

### Prasyarat
- [Bun](https://bun.sh) versi terbaru
- Docker & Docker Compose (untuk MySQL, Redis, RabbitMQ)

### 1. Clone repository
```bash
git clone https://github.com/hudaputrasantosa/marketplace-api.git
cd marketplace-api
```

### 2. Install dependencies
```bash
bun install
```

### 3. Siapkan environment variable
```bash
cp .env.example .env
```
Sesuaikan isi `.env` sesuai kebutuhan (khususnya `SECRET_KEY`, `REFRESH_SECRET_KEY`, dan kredensial database).

### 4. Jalankan service pendukung (MySQL, Redis, RabbitMQ)
```bash
docker compose -f docker/docker-compose.yml up -d db redis rabbitmq
```

### 5. Migrasi & seed database
```bash
bun run db:migrate
bun run db:seed
```

### 6. Jalankan server (dev, watch mode)
```bash
bun run dev
```
Server berjalan di `http://localhost:8080`, dokumentasi API tersedia di `http://localhost:8080/api/docs`.

### Alternatif: jalankan seluruh stack dengan Docker Compose
```bash
docker compose -f docker/docker-compose.yml up --build
```
Migrasi & seed di dalam container:
```bash
docker compose -f docker/docker-compose.yml exec app bun run db:migrate
docker compose -f docker/docker-compose.yml exec app bun run db:seed
```

### Perintah lain yang berguna
```bash
bun run typecheck    # cek type error
bun run lint         # cek ESLint
bun run format       # format dengan Biome
bun test             # jalankan test
```

## 📁 Project Structure
```
marketplace-api/
├── database/
│   ├── migrations/               # hasil `drizzle-kit generate`
│   ├── migrate.ts                # runner migration
│   └── seed.ts                   # seed admin & pembeli user
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml        # service app, db (MySQL), redis, rabbitmq
├── src/
│   ├── main.ts                    # entrypoint: bootstrap, startup checks, listen, graceful shutdown
│   ├── app.ts                     # buildApp(): fastify instance, plugins, module registration
│   ├── common/
│   │   ├── config/env.ts          # zod-validated env -> typed `config` (config.app, config.database, ...)
│   │   ├── database/
│   │   │   ├── client.ts          # drizzle(mysql2 pool)
│   │   │   └── schema/            # schema & relations user/product/wallet/transaction
│   │   ├── redis/redis.service.ts
│   │   ├── rabbitmq/rabbitmq.service.ts
│   │   ├── queue/queue.service.ts
│   │   ├── jobs/monthly-report.job.ts
│   │   ├── observability/         # glitchtip.ts, otel.ts
│   │   ├── logger/logger.ts       # winston logger
│   │   ├── errors/app-error.ts    # AppError & subclasses
│   │   ├── plugins/               # auth.guard.ts, role.guard.ts, error-handler.ts
│   │   ├── utils/                 # api-response.ts, openapi-schemas.ts
│   │   ├── testing/test-app.ts    # helper untuk unit test route per modul
│   │   └── types/fastify.d.ts
│   └── modules/
│       ├── auth/        # controller, service, repository, routes, module, mapper, dto/, interfaces/, test
│       ├── product/     # (struktur sama)
│       ├── wallet/      # (struktur sama)
│       └── transaction/ # (struktur sama)
├── biome.json
├── drizzle.config.ts
├── eslint.config.js
├── tsconfig.json
└── package.json
```

Setiap modul (`auth`, `product`, `wallet`, `transaction`) mandiri dan berisi:
- **repository** — query Drizzle
- **service** — business logic
- **controller** — adaptasi request/reply Fastify
- **routes** — registrasi path + schema Zod
- **dto** — Zod schema + type (key tetap Bahasa Indonesia sesuai kontrak API)
- **mapper** — translate entity (Inggris) <-> wire shape response (Indonesia)
- **interface** — kontrak repository/service

> Detail lebih lengkap tentang arsitektur, business rules, dan konvensi kode ada di [AGENTS.md](AGENTS.md) dan [PROJECT_RULES.md](PROJECT_RULES.md).

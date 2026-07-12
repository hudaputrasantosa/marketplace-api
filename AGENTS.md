# AGENTS.md — Marketplace API

## Project overview
- Project ini adalah **REST API Marketplace** dibangun dengan **Bun + Fastify + TypeScript**.
- Arsitektur **modular, terinspirasi NestJS** — setiap domain (`auth`, `product`, `wallet`, `transaction`) adalah
  modul mandiri berisi controller/service/repository/dto/interface sendiri, di-wire secara manual (tanpa DI
  container).
- ORM: **Drizzle ORM** dengan database **MySQL**.
- Environment dijalankan menggunakan **Docker Compose** (app + MySQL + Redis + RabbitMQ).
- Referensi lengkap tentang entitas, business rules, dan API contract ada di `PROJECT_RULES.md`.

## Penting: kode Inggris, kontrak API tetap Bahasa Indonesia
Sejak TASK 2, semua identifier internal (nama modul/folder, class, method, kolom database) memakai **Bahasa
Inggris** — tapi **URL route, nama field JSON request/response, dan teks `message`** di response TIDAK berubah
sama sekali dari API awal, supaya Postman collection/klien lama tetap kompatibel. Contoh: folder `src/modules/product/`
dan class `ProductService`, tapi endpoint tetap `POST /api/produks/tambah` dengan body `{ "nama", "harga", "jumlah",
"deskripsi" }`. Setiap modul punya file `*.mapper.ts` yang menjembatani ini — entity internal (`Product.name`,
`Product.price`, dst) dipetakan ke response wire-shape asli (`nama`, `harga`, dst) di sana, dan DTO Zod schema
sengaja tetap memakai key Bahasa Indonesia sebagai kontrak eksternal walau field internal setelah destructuring
sudah Inggris. **Jangan** mengganti nama route, key JSON, atau isi `message` — hanya identifier kode dan skema DB
yang boleh diterjemahkan.

## Tech stack
- Runtime: **Bun** (latest) — menjalankan `.ts` secara langsung, tanpa build step di dev maupun prod.
- Language: **TypeScript** (strict mode)
- Framework: **Fastify v4**
- ORM: **Drizzle ORM** (`drizzle-orm/mysql2`) + **drizzle-kit** untuk migration
- Validation/DTO: **Zod** via `fastify-type-provider-zod` (skema yang sama dipakai untuk validasi runtime *dan*
  generate dokumentasi OpenAPI)
- Auth: **@fastify/jwt**
- Docs: **@fastify/swagger** (generate OpenAPI dari schema route) + **Scalar** (`@scalar/fastify-api-reference`) di
  `/api/docs` — route baru otomatis muncul di docs selama route punya `schema`, tidak perlu edit file docs manual.
- Cache: **ioredis** (`src/common/redis/redis.service.ts`) — satu koneksi persisten yang di-reuse lewat singleton
  `redisService`, bukan dibuat baru setiap kali dipakai.
- Message broker: **amqplib/RabbitMQ** (`src/common/rabbitmq/rabbitmq.service.ts`) — publish, consume
  (`startExampleConsumer()` sebagai contoh nyata), dan health check siap pakai.
- Background jobs: **BullMQ** (`src/common/queue/queue.service.ts`) — queue + worker generik, plus job nyata
  `src/common/jobs/monthly-report.job.ts` (laporan bulanan terjadwal). Dashboard Bull Board di `GET /api/admin/queues`
  (`src/common/plugins/bull-board.plugin.ts`) digerbang dengan **HTTP Basic Auth**
  (`BULL_BOARD_USERNAME`/`BULL_BOARD_PASSWORD`), bukan JWT bearer seperti route lain — dashboard ini dibuka langsung
  di browser, yang tidak bisa menempelkan header `Authorization: Bearer` saat navigasi biasa.
- Observability:
  - **GlitchTip** (`src/common/observability/glitchtip.ts`, pakai `@sentry/node` — protokolnya kompatibel) untuk
    menangkap error 5xx yang tidak teridentifikasi. No-op kalau `GLITCHTIP_DSN` kosong.
  - **Healthcheck**: `GET /health` (root, di luar prefix `/api`, bukan bagian dari kontrak API bisnis) — deep
    check tiap request (MySQL wajib nyala/503 kalau gagal, Redis & RabbitMQ opsional/dilaporkan up-down saja),
    dipakai Docker healthcheck & orchestrator lain. Lihat `src/common/plugins/health.plugin.ts`.
  - **OpenTelemetry** (`src/common/observability/otel.ts`) untuk tracing, off by default (`OTEL_ENABLED=false`),
    disiapkan untuk integrasi Grafana/Tempo di masa depan. **Catatan**: sebagian auto-instrumentation Node OTel
    punya keterbatasan kompatibilitas di bawah Bun — tracing mungkin tidak selengkap di Node native.
- Testing: **bun test** (Jest-compatible API) + helper `src/common/testing/test-app.ts` (real listener + `fetch()`,
  bukan `.inject()` — lihat catatan di bawah).
- Formatter: **Biome** (format + organize imports saja, linter Biome dimatikan).
- Linter: **ESLint** (flat config) + `typescript-eslint`.
- Commit hook: **Husky** + **lint-staged** menjalankan Biome format lalu ESLint pada file staged.
- Containerization: **Docker** + **Docker Compose** (`docker/Dockerfile`, `docker/docker-compose.yml`).

## Modular pattern structure
```
src/
├── main.ts                       # entrypoint: otel/glitchtip bootstrap, startup checks, listen, graceful shutdown
├── app.ts                        # buildApp(): fastify instance, plugins, module registration
├── common/
│   ├── config/env.ts             # zod-validated process.env -> typed nested `config` (config.app, config.database, ...)
│   ├── database/
│   │   ├── client.ts             # drizzle(mysql2 pool) - pool size & query logging from config
│   │   └── schema/                # user/product/wallet/transaction schema + relations (English table/column names)
│   ├── redis/redis.service.ts
│   ├── rabbitmq/rabbitmq.service.ts
│   ├── queue/queue.service.ts
│   ├── jobs/monthly-report.job.ts # BullMQ repeatable job: aggregates last month's transactions
│   ├── observability/glitchtip.ts, otel.ts
│   ├── logger/logger.ts          # pino - full console (pino-pretty) in dev, error-level only console in prod
│   ├── startup/startup-banner.ts # boxen/chalk/cli-table3/ora startup summary printed from main.ts
│   ├── errors/app-error.ts        # AppError + subclasses (BadRequest/Unauthorized/.../Conflict)
│   ├── plugins/
│   │   ├── auth.guard.ts         # preHandler: verifikasi JWT -> request.user
│   │   ├── role.guard.ts         # requireRole('admin'|'pembeli') preHandler factory
│   │   ├── basic-auth.guard.ts   # basicAuthGuard(realm, creds) preHandler factory - for browser-opened UIs (Bull Board)
│   │   ├── health.plugin.ts      # GET /health (root) deep-checks MySQL/Redis/RabbitMQ
│   │   └── error-handler.ts      # fastify setErrorHandler -> {status,message} envelope, reports 5xx to GlitchTip
│   ├── utils/
│   │   ├── response.ts           # helper untuk response envelope standar
│   │   └── openapi-schemas.ts    # skema response bersama untuk dokumentasi Scalar
│   ├── testing/test-app.ts       # helper untuk unit test route per-modul
│   └── types/fastify.d.ts        # augment FastifyJWT payload -> {id, role}
├── modules/
│   ├── auth/        {auth.controller.ts, auth.service.ts, auth.repository.ts, auth.routes.ts, auth.module.ts,
│   │                 auth.mapper.ts, dto/register.dto.ts, dto/login.dto.ts, interfaces/, auth.test.ts}
│   ├── product/     (struktur sama, plus product.mapper.ts — dulu bernama `produk`)
│   ├── wallet/      (struktur sama, plus wallet.mapper.ts — dulu bernama `dompet`)
│   └── transaction/ (struktur sama, plus transaction.mapper.ts — dulu bernama `transaksi`)
database/
├── migrations/                   # hasil `drizzle-kit generate`
├── migrate.ts                    # runner migration
└── seed.ts                       # seed admin + pembeli user
docker/
├── Dockerfile
└── docker-compose.yml
```
- Setiap modul berisi: **repository** (query Drizzle), **service** (business logic, transaction), **controller**
  (adaptasi request/reply Fastify), **routes** (registrasi path + schema Zod), **dto** (Zod schema + type, key
  tetap Bahasa Indonesia sesuai kontrak API), **mapper** (translate entity Inggris <-> wire shape Indonesia), dan
  **interface** (kontrak repository/service).
- Jangan mencampur logic antar-modul. Jika modul A butuh data dari modul B, panggil melalui service modul B.
- Business logic yang melempar error terduga (not found, conflict, dst) **WAJIB** menggunakan class dari
  `common/errors/app-error.ts` (`NotFoundError`, `ConflictError`, dst) — akan otomatis dipetakan ke response
  envelope yang benar oleh `error-handler.ts`, dan untuk 5xx otomatis dilaporkan ke GlitchTip.

## Config layer
- **Jangan** akses `process.env` langsung dari service/repository/controller manapun — semua env var
  divalidasi dan dinormalisasi sekali di `src/common/config/env.ts`, lalu diakses lewat objek `config` bernamespace:
  `config.app`, `config.auth`, `config.database`, `config.redis`, `config.rabbitmq`, `config.security`,
  `config.observability`, `config.jobs`. Satu-satunya pengecualian sah adalah `drizzle.config.ts` (config CLI
  drizzle-kit, dijalankan di luar aplikasi).
- `config.app.isDevelopment` / `isProduction` / `isTest` dipakai untuk perilaku yang berbeda per environment
  (misalnya console logging, lihat di bawah).

## Dev environment tips
- Jalankan seluruh stack dengan Docker Compose:
  ```bash
  docker compose -f docker/docker-compose.yml up --build
  ```
- Untuk development tanpa Docker, pastikan MySQL/Redis/RabbitMQ sudah jalan (bisa `docker compose up -d db redis
  rabbitmq` saja), lalu jalankan:
  ```bash
  bun install
  bun run dev
  ```
- Bun menjalankan `.ts` langsung — tidak perlu `ts-node`/`tsx`/build step.
- Konfigurasi TypeScript ada di `tsconfig.json` (`strict: true`). Jalankan `bun run typecheck` sebelum commit.
- Environment variable divalidasi via `src/common/config/env.ts` (zod). Salin `.env.example` ke `.env` untuk lokal.
- File `.env` **TIDAK BOLEH** di-commit.
- Saat start, `main.ts` mengecek koneksi tiap service lewat `withSpinner()` (`src/common/startup/startup-banner.ts`,
  pakai Ora spinner di development) — MySQL wajib nyala (fatal kalau gagal), Redis/RabbitMQ opsional (warning saja
  kalau tidak tersedia, aplikasi tetap jalan). Setelah `app.listen()`, `printStartupBanner()` mencetak ringkasan
  startup (Boxen header nama/versi/environment/commit, tabel status dependency dari cli-table3, dan daftar URL
  App/Docs/Healthcheck/BullMQ Board/RabbitMQ Management yang diwarnai Chalk).
- Healthcheck tersedia di `GET /health` (root, bukan `/api/health`) — dipakai Docker healthcheck di
  `docker/docker-compose.yml` dan bisa dites manual: `curl http://localhost:8080/health`.
- Matikan server dengan `Ctrl+C` (SIGINT) atau `SIGTERM` — graceful shutdown akan menutup Fastify, pool MySQL,
  koneksi Redis, dan koneksi RabbitMQ secara berurutan sebelum proses keluar.

## Docker instructions
- `docker/Dockerfile` — multi-stage build image Bun (menjalankan `bun src/main.ts` langsung, tanpa compile).
- `docker/docker-compose.yml` — service `app`, `db` (MySQL 8), `redis`, `rabbitmq` (management UI di port 15672).
- Migration & seed di dalam container:
  ```bash
  docker compose -f docker/docker-compose.yml exec app bun run db:migrate
  docker compose -f docker/docker-compose.yml exec app bun run db:seed
  ```

## TypeScript rules
- Semua source code di `src/` dan `database/` menggunakan TypeScript (`.ts`), ES Module syntax.
- `strict: true` aktif di `tsconfig.json`. Hindari `any` — gunakan cast eksplisit ke DTO type setelah Zod validasi
  bila diperlukan (lihat pola di semua `*.controller.ts`: `request.body as XDto`).
- Setiap modul **WAJIB** punya interface (`interfaces/*.interface.ts`) dan DTO (`dto/*.dto.ts`, Zod schema + inferred
  type) — DTO dipakai baik untuk validasi request maupun tipe TypeScript.

## Naming conventions
- File: `namaModul.layer.ts` dalam Bahasa Inggris (contoh: `product.controller.ts`, `wallet.service.ts`).
- Variabel, fungsi, class, kolom database: **Bahasa Inggris** (contoh: `getProduct`, `createTransaction`,
  `ProductService`, kolom `price`/`stock`).
- Route path, key JSON body/response, dan teks `message`: **tetap Bahasa Indonesia**, tidak berubah dari API awal
  (contoh: `/setor-saldo`, field `no_ktp`/`saldo`/`id_produk`, pesan `"Berhasil Mengambil data"`).
- Interface repository/service diawali `I` (contoh: `IProductRepository`).
- Environment variable: `UPPER_SNAKE_CASE`.
- Test file: colocated di dalam modul masing-masing dengan suffix `.test.ts`.

## Testing instructions
- Framework: **bun test** (API kompatibel dengan Jest: `describe`/`it`/`expect`/`mock`).
- HTTP testing: gunakan `createTestApp(prefix, registerFn)` dari `src/common/testing/test-app.ts` — ini membuat
  Fastify instance sungguhan yang listen di port acak dan expose `.inject()` yang secara internal memakai
  `fetch()` asli, **bukan** `light-my-request` bawaan Fastify (`app.inject()` bawaan Fastify saat ini crash di
  bawah Bun — `ERR_HTTP_HEADERS_SENT` — karena inkompatibilitas Bun dengan mocked `http.ServerResponse` milik
  `light-my-request`). Jangan kembali ke `app.inject()` langsung sebelum masalah itu diperbaiki upstream.
- Repository di-mock via `bun:test`'s `mock()` mengikuti interface modul (`IProductRepository`, dst) — service
  diuji dengan repository palsu, tanpa perlu koneksi database sungguhan.
- Jalankan semua test:
  ```bash
  bun test
  ```
- Setiap modul **WAJIB** punya test minimal untuk: 401 (tanpa token), 403/409 (role salah), 400 (validasi gagal),
  2xx (sukses), 404 (data tidak ditemukan) — lihat `*.test.ts` di tiap modul sebagai contoh pola. Body/response
  test tetap memakai key Bahasa Indonesia (`nama`, `no_ktp`, dst) karena itu kontrak API-nya.
- Fix semua test dan type error sebelum commit: `bun run typecheck && bun test`.

## Code style rules
- Gunakan **async/await**.
- Business logic **WAJIB** di service layer, akses data **WAJIB** lewat repository — controller hanya adaptasi
  request/reply, mapping DTO<->entity lewat `*.mapper.ts`, dan pemanggilan service.
- Response format konsisten: `{ status, message, data? }` (sukses) atau `{ status, message }` / `{ status, errors }`
  (error) — pakai helper `success()`/`failure()`/`validationError()` dari `common/utils/response.ts`.
- Error bisnis terduga **WAJIB** dilempar sebagai `AppError` subclass, jangan `res.status(...).send(...)` manual di
  service layer.
- Operasi yang melibatkan multiple table (transaction, wallet) **WAJIB** menggunakan `db.transaction()` Drizzle
  dengan `.for("update")` row lock pada baris yang dibaca sebelum ditulis.
- Jangan gunakan `console.log` di kode aplikasi (`src/`) — gunakan **Pino logger** (`logger.info/warn/error/debug`,
  argumen object taruh **sebelum** message string kalau butuh metadata, contoh: `logger.debug({ params }, msg)`).
  Di development semua level tampil di console lewat `pino-pretty`; di production hanya level `error` yang tampil
  di console (5xx, uncaught exception, dst) agar tetap terlihat lewat `docker logs`/log aggregation, level lain
  tetap ditulis ke file saja. Di test, console tetap senyap sepenuhnya. Script CLI di `database/` dan `main.ts`
  boleh pakai `console.log` untuk output progres/status startup (termasuk startup banner).
- Endpoint publik yang rawan brute-force (`/api/auth/*`) **WAJIB** pakai rate limit lebih ketat lewat
  `config: { rateLimit: config.security.rateLimit.auth }` di route options — lihat `auth.routes.ts`.

## PR & commit instructions
- Title format: `[marketplace-api] <Deskripsi singkat perubahan>`
- Sebelum commit, **WAJIB** jalankan:
  ```bash
  bun run typecheck    # Pastikan tidak ada type error
  bun run lint          # Pastikan ESLint lolos
  bun run format:check  # Pastikan Biome format lolos
  bun test              # Pastikan semua test hijau
  ```
- Husky pre-commit hook menjalankan `lint-staged` (Biome format + ESLint) otomatis pada file staged.
- Jangan push langsung ke branch `master`. Gunakan branch `refactor` atau feature branch.
- Pastikan `bun.lock` di-commit jika ada perubahan dependency.
- Jangan commit file `.env`, `logs/*.log`, atau `node_modules/`.

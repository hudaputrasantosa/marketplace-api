# 📋 Project Rules — Marketplace API

> Dokumen ini berisi aturan, konvensi, dan panduan pengembangan untuk project **REST API Marketplace**.
> Wajib dibaca dan diikuti oleh seluruh kontributor sebelum melakukan perubahan pada codebase.

---

## 1. Gambaran Umum Project

**Marketplace API** adalah aplikasi backend REST API yang menyediakan endpoint untuk sistem pengelolaan produk dan
transaksi pembelian pada marketplace. Dibangun menggunakan **Bun + Fastify + TypeScript** dengan **Drizzle ORM** dan
database **MySQL**, mengikuti arsitektur modular yang terinspirasi NestJS.

**Konvensi bahasa (penting):** semua identifier kode (nama modul/folder, class, fungsi, kolom database) memakai
**Bahasa Inggris**. Tapi **URL route, key JSON request/response, dan teks `message`** tetap **Bahasa Indonesia**
persis seperti API awal — supaya tidak ada breaking change untuk klien lama. Lihat §9.1 dan `AGENTS.md` untuk
detail pola mapper yang menjembatani keduanya.

### Tech Stack

| Komponen          | Teknologi                                  |
|-------------------|---------------------------------------------|
| Runtime           | Bun (latest)                                 |
| Language          | TypeScript (strict)                          |
| Framework         | Fastify v4                                   |
| ORM               | Drizzle ORM (`drizzle-orm/mysql2`)           |
| Database          | MySQL 8 (via `mysql2` driver, pooled connection) |
| Validation/DTO    | Zod + `fastify-type-provider-zod`             |
| Authentication    | `@fastify/jwt`                                |
| Password Hashing  | bcryptjs (salt round 8)                       |
| Security          | `@fastify/helmet`, `@fastify/cors`, `@fastify/rate-limit` (global + stricter per-route pada `/api/auth/*`) |
| Cache             | ioredis (koneksi persisten, singleton)        |
| Message broker    | amqplib / RabbitMQ (publish + consume)        |
| Background jobs   | BullMQ (queue/worker generik + job laporan bulanan) |
| Error tracking    | GlitchTip via `@sentry/node` (no-op tanpa DSN) |
| Tracing           | OpenTelemetry (off by default, untuk Grafana di masa depan) |
| Response compression | `@fastify/compress` (gzip/brotli otomatis)  |
| Logging           | Pino (file + console, `pino-pretty` saat development)  |
| Startup banner    | Chalk, Boxen, cli-table3, Ora                  |
| Documentation     | `@fastify/swagger` + Scalar (`/api/docs`)     |
| Testing           | `bun test` + custom Fastify test helper       |
| Dev Tools         | Biome (format), ESLint (lint), Husky + lint-staged |
| Containerization  | Docker + Docker Compose                       |

---

## 2. Arsitektur & Struktur Folder

Project mengikuti pola **modular per-domain** (terinspirasi NestJS): setiap domain adalah modul mandiri berisi
repository (akses data), service (business logic), controller (adaptasi request/reply), routes (registrasi path +
schema), DTO (Zod schema, key tetap Bahasa Indonesia), mapper (translate entity Inggris <-> wire shape Indonesia),
dan interface (kontrak).

```
marketplace-api/
├── src/
│   ├── main.ts                    # Entry point: otel/glitchtip bootstrap, startup checks, listen, graceful shutdown
│   ├── app.ts                     # buildApp(): plugin & module registration
│   ├── common/
│   │   ├── config/env.ts          # Validasi environment variable (zod) -> nested `config` object
│   │   ├── database/
│   │   │   ├── client.ts          # Drizzle client (mysql2 pool), pool size & query logging dari config
│   │   │   └── schema/            # Definisi tabel + relasi Drizzle (nama Inggris)
│   │   ├── redis/redis.service.ts
│   │   ├── rabbitmq/rabbitmq.service.ts
│   │   ├── queue/queue.service.ts  # BullMQ queue + worker generik
│   │   ├── jobs/monthly-report.job.ts # BullMQ repeatable job: agregasi transaksi bulan lalu
│   │   ├── observability/         # glitchtip.ts, otel.ts
│   │   ├── logger/logger.ts       # Pino logger
│   │   ├── startup/startup-banner.ts # Boxen/Chalk/cli-table3/Ora startup summary
│   │   ├── errors/app-error.ts    # AppError + subclasses per status code
│   │   ├── plugins/               # auth.guard.ts, role.guard.ts, error-handler.ts, health.plugin.ts
│   │   ├── utils/                 # response.ts, openapi-schemas.ts
│   │   ├── testing/test-app.ts    # Helper unit test route per modul
│   │   └── types/fastify.d.ts     # Augment tipe JWT payload
│   └── modules/
│       ├── auth/                  # register (daftar), login (masuk), logout (keluar)
│       ├── product/                # CRUD produk (admin) - dulu `produk`
│       ├── wallet/                 # dompet, deposit/withdraw saldo (pembeli) - dulu `dompet`
│       └── transaction/            # riwayat & buat transaksi (pembeli) - dulu `transaksi`
├── database/
│   ├── migrations/                # Hasil `drizzle-kit generate`
│   ├── migrate.ts                 # Runner migration
│   └── seed.ts                    # Seed admin + pembeli user
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── logs/                          # Log output (error.log, combined.log)
├── .env.example                   # Template environment variable
├── drizzle.config.ts              # Konfigurasi drizzle-kit
└── package.json
```

### Aturan Struktur Folder

- **JANGAN** menaruh file di luar folder yang sudah ditentukan.
- Setiap modul baru **WAJIB** memiliki: repository, service, controller, routes, DTO, mapper (jika field
  internal berbeda dari wire contract), dan interface masing-masing, plus file test colocated (`*.test.ts`).
- Penamaan file mengikuti pola `namaModul.layer.ts` dalam Bahasa Inggris (contoh: `product.controller.ts`).
- Kode/service yang bersifat lintas-modul (Redis, RabbitMQ, BullMQ, logger, observability, error handling)
  diletakkan di `src/common/`.

---

## 3. Entitas & Model Data

Project memiliki **4 entitas utama** (didefinisikan di `src/common/database/schema/`, nama tabel/kolom Inggris,
lihat §9.1 untuk pemetaan ke kontrak API):

### 3.1 User (tabel `users`)

| Field (DB/kode) | Field JSON (kontrak API) | Tipe           | Keterangan                        |
|------------------|---------------------------|----------------|------------------------------------|
| id               | id                         | INTEGER (PK)   | Auto-increment                    |
| name             | nama                       | STRING         | Nama pengguna                     |
| role             | role                       | ENUM           | `"admin"` atau `"pembeli"`        |
| email            | email                      | STRING         | Harus unik, disimpan lowercase    |
| password         | password (tidak di-response) | STRING      | Di-hash menggunakan bcryptjs (salt round: 8) |
| createdAt/updatedAt | createdAt/updatedAt     | DATE           | Auto-managed                      |

**Relasi:** `User` hasMany `Transaction` (FK: `user_id`), `User` hasOne `Wallet` (FK: `user_id`)

### 3.2 Product (tabel `products`, dulu `Produk`)

| Field (DB/kode) | Field JSON (kontrak API) | Tipe    | Keterangan                        |
|------------------|---------------------------|---------|------------------------------------|
| id               | id                         | INTEGER (PK) | Auto-increment                |
| name             | nama                       | STRING  | Nama produk                       |
| price            | harga                      | INTEGER | Harga produk (rupiah)              |
| stock            | jumlah                     | INTEGER | Stok produk                        |
| description      | deskripsi                  | TEXT    | Deskripsi produk                   |

**Relasi:** `Product` hasOne `Transaction` (FK: `product_id`)

### 3.3 Wallet (tabel `wallets`, dulu `Dompet`)

| Field (DB/kode) | Field JSON (kontrak API) | Tipe    | Keterangan                        |
|------------------|---------------------------|---------|------------------------------------|
| id               | id                         | INTEGER (PK) | Auto-increment                |
| userId           | id_user                    | INTEGER (FK) | Referensi ke User              |
| idNumber         | no_ktp                     | STRING  | Nomor KTP (min. 16 karakter)       |
| balance          | saldo                       | INTEGER | Saldo dompet (default: 0)          |

### 3.4 Transaction (tabel `transactions`, dulu `Transaksi`)

| Field (DB/kode) | Field JSON (kontrak API) | Tipe    | Keterangan                           |
|------------------|---------------------------|---------|----------------------------------------|
| id               | id                         | INTEGER (PK) | Auto-increment                   |
| productId        | id_produk                  | INTEGER (FK) | Referensi ke Product              |
| userId           | id_user                    | INTEGER (FK) | Referensi ke User                 |
| quantity         | kuantitas                  | INTEGER | Jumlah produk yang dibeli              |
| totalPrice       | jumlah_harga                | INTEGER | Total harga (harga × kuantitas)       |

---

## 4. Business Rules & Validasi

Business rules **tidak berubah** dari sebelumnya — hanya representasi kode yang beralih ke Bahasa Inggris (lihat
§3 untuk pemetaan field).

### 4.1 Validasi User

- Email **WAJIB unik** — pengecekan duplikasi email saat registrasi.
- Password minimal **8 karakter**, harus mengandung huruf besar, huruf kecil, dan angka.
- Role hanya boleh bernilai `"admin"` atau `"pembeli"`.
- Email disimpan dalam format **lowercase**.

### 4.2 Validasi Produk

- Setiap manajemen produk (CRUD) **WAJIB** pengecekan autentikasi dan role `"admin"`.
- Field `nama`, `harga`, `deskripsi`, dan `jumlah` wajib diisi saat membuat produk.
- Field `harga` dan `jumlah` harus berupa angka (JSON number, bukan string).
- Saat update, field `harga` dan `jumlah` bersifat opsional namun tetap harus numerik jika diisi — hanya field
  yang dikirim yang diperbarui (partial update).

### 4.3 Validasi Dompet

- Semua aksi pada entitas Dompet **WAJIB** pengecekan autentikasi dan role `"pembeli"`.
- Dompet hanya dibuat **1 kali untuk 1 user** — pengecekan duplikasi sebelum pembuatan.
- `no_ktp` wajib diisi dan minimal **16 karakter**.
- Setor saldo: minimal **Rp 10.000** per transaksi.
- Tarik saldo:
  - Minimal **Rp 10.000** per transaksi.
  - Saldo harus **mencukupi** (saldo ≥ jumlah penarikan).

### 4.4 Validasi Transaksi

- Setiap pembuatan transaksi **WAJIB** pengecekan:
  1. Autentikasi (token valid)
  2. Role `"pembeli"`
  3. Ketersediaan dompet
  4. Saldo mencukupi (saldo > jumlah_harga)
  5. Stok produk tersedia (jumlah ≥ kuantitas, kuantitas ≠ 0)
- Melihat riwayat transaksi **WAJIB** pengecekan autentikasi.
- Transaksi menggunakan **Drizzle transaction** (`db.transaction()`) dengan `SELECT ... FOR UPDATE` pada baris
  produk & dompet untuk menjamin atomicity dan mencegah race condition.

---

## 5. API Endpoints & Routing

### Base URL
```
http://localhost:8080/api/
```

### API Documentation (Scalar)
```
http://localhost:8080/api/docs
```
Dokumentasi digenerate otomatis dari schema Zod tiap route. Menambah route baru dengan `schema` yang lengkap
**otomatis** muncul di docs — tidak perlu edit file docs manual.

### Endpoint Table

Endpoint, method, dan field JSON **tidak berubah** dari versi sebelumnya walau modul internalnya sudah di-rename
ke Bahasa Inggris:

| Method   | Endpoint                   | Auth | Role     | Deskripsi                         | Rate limit khusus |
|----------|-----------------------------|------|----------|-----------------------------------|--------------------|
| POST     | `/api/auth/daftar`         | ❌   | -        | Registrasi akun baru              | ✅ (lebih ketat)   |
| POST     | `/api/auth/masuk`          | ❌   | -        | Login dan mendapatkan JWT token   | ✅ (lebih ketat)   |
| POST     | `/api/auth/keluar`         | ✅   | -        | Logout dari sistem                | -                  |
| GET      | `/api/produks`             | ✅   | admin    | Lihat semua produk                | -                  |
| GET      | `/api/produks/:id`         | ✅   | admin    | Lihat detail 1 produk             | -                  |
| POST     | `/api/produks/tambah`      | ✅   | admin    | Tambah produk baru                | -                  |
| PUT      | `/api/produks/ubah/:id`    | ✅   | admin    | Update data produk                | -                  |
| DELETE   | `/api/produks/hapus/:id`   | ✅   | admin    | Hapus produk                      | -                  |
| GET      | `/api/dompets/detail`      | ✅   | pembeli  | Lihat detail dompet user          | -                  |
| POST     | `/api/dompets/tambah`      | ✅   | pembeli  | Buat dompet baru                  | -                  |
| POST     | `/api/dompets/setor-saldo` | ✅   | pembeli  | Setor saldo ke dompet             | -                  |
| POST     | `/api/dompets/tarik-saldo` | ✅   | pembeli  | Tarik saldo dari dompet           | -                  |
| GET      | `/api/transaksi/riwayat`   | ✅   | pembeli  | Lihat riwayat transaksi           | -                  |
| POST     | `/api/transaksi/buat-transaksi` | ✅ | pembeli | Buat transaksi pembelian      | -                  |

### Aturan Routing

- Semua route terdaftar di bawah prefix `/api`.
- Route didefinisikan per-modul di `<modul>.routes.ts`, registrasi module dilakukan di `<modul>.module.ts`, dan
  di-mount di `src/app.ts`.
- Middleware chain pada route mengikuti urutan: **authGuard → requireRole(...) → (validasi Zod otomatis via
  schema) → controller**.

---

## 6. Keamanan (Security)

### 6.1 Autentikasi

- Menggunakan **JWT** via `@fastify/jwt`, secret dari environment variable `SECRET_KEY`.
- Token berlaku sesuai `JWT_EXPIRES_IN` (default **1 jam**).
- Token dikirim melalui header `Authorization: Bearer <token>`.
- Payload JWT berisi: `{ id, role }`.

### 6.2 Guard & Middleware

| Guard/Plugin           | Fungsi                                                     |
|------------------------|--------------------------------------------------------------|
| `authGuard`             | Verifikasi JWT dari header Authorization (`common/plugins/auth.guard.ts`) |
| `requireRole("admin")`  | Memastikan `request.user.role === "admin"`                  |
| `requireRole("pembeli")`| Memastikan `request.user.role === "pembeli"`                 |
| `basicAuthGuard(realm, creds)` | HTTP Basic Auth (`common/plugins/basic-auth.guard.ts`), khusus route yang dibuka langsung dari browser (bukan API client) - dipakai Bull Board (`/api/admin/queues`) karena JWT bearer tidak bisa ditempel browser saat navigasi biasa |
| `errorHandler`          | Global error handler Fastify → response envelope konsisten, melaporkan 5xx ke GlitchTip |

### 6.3 Rate Limiting & Proteksi Tambahan

- **@fastify/helmet** — HTTP security headers (CSP diatur agar Scalar docs tetap bisa render script bootstrap-nya).
- **@fastify/cors** — Dibatasi ke origin dari env `CORS_ORIGIN` (default `http://localhost:8080`).
- **@fastify/rate-limit**:
  - Global: `RATE_LIMIT_MAX`/`RATE_LIMIT_WINDOW` (default 100 request / 5 menit per IP).
  - Endpoint publik yang rawan brute-force (`/api/auth/daftar`, `/api/auth/masuk`) pakai limit lebih ketat:
    `AUTH_RATE_LIMIT_MAX`/`AUTH_RATE_LIMIT_WINDOW` (default 10 request / 5 menit), diterapkan lewat
    `config: { rateLimit: config.security.rateLimit.auth }` di route options.
- **@fastify/compress** — response otomatis di-gzip/brotli sesuai `Accept-Encoding`.
- **Password Hashing** — bcryptjs dengan **salt round 8**.
- **Production error responses** tidak menampilkan detail internal (`error.message`/stack) ke klien — hanya
  `"Internal Server Error"` generik; detail lengkap tetap masuk Pino + GlitchTip.

### 6.4 Environment Variables

Divalidasi via `src/common/config/env.ts` (zod) dan diakses lewat objek `config` bernamespace (`config.app`,
`config.database`, dst) — **jangan** baca `process.env` langsung di luar `env.ts`. Lihat `.env.example` untuk
daftar lengkap variabel.

> ⚠️ **JANGAN** commit file `.env` ke repository.

---

## 7. Response Format

Format response **tidak berubah** dari versi sebelumnya (helper: `common/utils/response.ts`):

### Success Response
```json
{ "status": "OK", "message": "Deskripsi keberhasilan", "data": { ... } }
```

### Created Response
```json
{ "status": "Created", "message": "Deskripsi pembuatan berhasil", "data": { ... } }
```

### Error Response
```json
{ "status": "Error | Bad Request | Unauthorized | Forbidden | Notfound | Conflict", "message": "Deskripsi error" }
```
Untuk error 5xx di production, `message` selalu `"Internal Server Error"` — tidak menampilkan detail internal.

### Validation Error Response
```json
{
  "status": "Bad Request",
  "errors": [{ "type": "field", "msg": "Pesan error validasi", "path": "nama_field", "location": "body" }]
}
```

### HTTP Status Code yang Digunakan

| Code | Status        | Penggunaan                                    |
|------|---------------|-----------------------------------------------|
| 200  | OK            | Request berhasil                              |
| 201  | Created       | Data berhasil dibuat/diperbarui               |
| 400  | Bad Request   | Validasi gagal                                |
| 401  | Unauthorized  | Token tidak ada / email/password salah        |
| 403  | Forbidden     | Token expired atau invalid                    |
| 404  | Not Found     | Data tidak ditemukan                          |
| 409  | Conflict      | Data duplikat / kondisi tidak terpenuhi       |
| 429  | Too Many Requests | Rate limit terlampaui                     |
| 500  | Error         | Internal server error (dilaporkan ke GlitchTip) |

---

## 8. Database

### Konfigurasi

- Konfigurasi koneksi database melalui environment variable (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`,
  `DB_NAME`, `DB_POOL_SIZE`, `DB_LOG_QUERIES`), divalidasi di `src/common/config/env.ts`.
- Drizzle client dibuat di `src/common/database/client.ts` — satu `mysql2` **connection pool** (bukan koneksi
  baru per request), ukuran pool diatur lewat `DB_POOL_SIZE` (default 10).
- `DB_LOG_QUERIES=true` menampilkan setiap SQL query yang dijalankan (lewat Pino `debug`) — hanya untuk
  debugging, default `false`.
- Default database: `db_market` (MySQL).

### Migration

- Setiap perubahan skema database **WAJIB** menggunakan migration.
- Generate migration dari schema: `bun run db:generate`
- Migration files berada di `database/migrations/`.
- Jalankan migration: `bun run db:migrate`

### Seeder

- Seeder ada di `database/seed.ts` (seed 1 user admin + 1 user pembeli).
- Jalankan seeder: `bun run db:seed`

### Aturan Model

- Semua tabel didefinisikan sebagai Drizzle schema di `src/common/database/schema/*.schema.ts`, penamaan tabel &
  kolom **Bahasa Inggris** (`users`, `products`, `wallets`, `transactions`).
- Relasi antar tabel didefinisikan terpisah di `src/common/database/schema/relations.ts` (menghindari circular
  import antar file schema).
- Kontrak JSON API (field request/response) tetap Bahasa Indonesia — lihat §3 untuk pemetaan lengkap, dijembatani
  oleh `*.mapper.ts` di tiap modul.

---

## 9. Konvensi Kode

### 9.1 Bahasa

- Identifier kode (nama file/folder, class, fungsi, variabel, kolom database) memakai **Bahasa Inggris**.
- URL route, key JSON body/response, dan teks `message` tetap **Bahasa Indonesia** — tidak berubah dari API awal.
- Setiap modul yang field internalnya berbeda dari wire contract **WAJIB** punya `*.mapper.ts` yang eksplisit
  menerjemahkan antara keduanya (lihat `product.mapper.ts`, `wallet.mapper.ts`, `transaction.mapper.ts`,
  `auth.mapper.ts` sebagai contoh).

### 9.2 Naming Convention

| Elemen            | Konvensi        | Contoh                              |
|-------------------|-----------------|--------------------------------------|
| File              | namaModul.layer.ts (Inggris) | `product.controller.ts`  |
| Variabel/Fungsi   | camelCase (Inggris) | `getProduct()`, `createTransaction()` |
| Class/Interface   | PascalCase (Inggris) | `ProductService`, `IProductRepository` |
| Kolom DB (SQL)    | snake_case (Inggris) | `user_id`, `id_number`, `total_price` |
| Field JSON (kontrak API) | tetap sesuai API awal | `no_ktp`, `saldo`, `id_produk`, `nama` |
| Route path        | kebab-case (Bahasa Indonesia, tidak berubah) | `/setor-saldo`, `/tarik-saldo` |
| Konstanta env     | UPPER_SNAKE_CASE| `SECRET_KEY`, `NODE_ENV`             |

### 9.3 Coding Style

- Gunakan `const` untuk variabel yang tidak di-reassign, `let` untuk yang di-reassign.
- Gunakan **async/await** untuk operasi asynchronous.
- Business logic **WAJIB** di service layer, akses data **WAJIB** lewat repository.
- Error bisnis terduga dilempar sebagai `AppError` subclass (`common/errors/app-error.ts`), ditangkap oleh global
  `errorHandler` — bukan `try/catch` manual di tiap controller.
- Export menggunakan **ES Module syntax** (`import`/`export`).
- **Jangan** akses `process.env` langsung — selalu lewat `config` bernamespace dari `common/config/env.ts`.

### 9.4 Pattern Modul (Controller → Service → Repository → Mapper)

```typescript
// product.controller.ts
export class ProductController {
  constructor(private readonly service: ProductService) {}

  getProduct = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as ProductParamsDto;
    const product = await this.service.getProduct(id);
    // Mapper menjaga response tetap { nama, harga, jumlah, deskripsi, ... } walau entity-nya English.
    return reply.status(200).send(success("OK", "Berhasil Mengambil data", toProductResponse(product)));
  };
}

// product.service.ts
export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async getProduct(id: number) {
    const product = await this.repository.findById(id);
    if (!product) throw new NotFoundError("Data Produk tidak ditemukan");
    return product;
  }
}
```

---

## 10. Transaction & Data Integrity

- Operasi yang melibatkan **multiple table updates** (transaksi pembelian, setor/tarik saldo) **WAJIB**
  menggunakan **Drizzle transaction**:
  ```typescript
  await db.transaction(async (tx) => {
    const [row] = await tx.select().from(table).where(...).for("update").limit(1);
    await tx.update(table).set({ ... }).where(...);
  });
  ```
- Gunakan `.for("update")` pada `SELECT` untuk row-level lock guna menghindari race condition pada operasi
  keuangan.
- Jika transaksi gagal (throw di dalam callback), Drizzle otomatis melakukan **rollback**.

---

## 11. Logging & Error Tracking

- Menggunakan **Pino** sebagai logger aplikasi (`src/common/logger/logger.ts`), dibangun lewat `pino.multistream()`
  (bukan `pino.transport()` worker-thread — kurang stabil di bawah Bun).
- Log level: `debug`. Output ke `logs/error.log` (khusus error) dan `logs/combined.log` (semua level).
- **Console transport hanya aktif di `NODE_ENV=development`** (lewat `pino-pretty`, berwarna) — production
  menampilkan level `error` saja ke stdout, test tidak menampilkan log ke stdout sama sekali (tetap tercatat di
  file). Ini memenuhi kebutuhan "tampilkan error di console saat development, jangan di production".
  `pino-pretty` ada di `devDependencies` — aman karena hanya di-`require()` di cabang `isDevelopment`, yang tidak
  pernah dieksekusi di install production.
- Pino memakai konvensi **object dulu, baru message** untuk metadata: `logger.debug({ params }, "[sql] ...")`,
  bukan gaya Winston (`logger.debug(msg, obj)`) — argumen kedua pada Pino diperlakukan sebagai format string, bukan
  merge object.
- Fastify juga punya request logger bawaan (pino) yang aktif secara default di `buildApp()` — instance terpisah
  dari `logger` aplikasi, keduanya sama-sama Pino jadi format log tetap konsisten.
- **GlitchTip** (`src/common/observability/glitchtip.ts`) menangkap setiap error 5xx yang tidak teridentifikasi
  lewat `@sentry/node` (protokol Sentry, kompatibel dengan GlitchTip). No-op kalau env `GLITCHTIP_DSN` kosong.
- Gunakan `logger.info()`/`logger.error()`, jangan `console.log` langsung di kode aplikasi (`src/`) — kecuali
  script CLI (`database/*.ts`) dan pesan status/startup banner di `main.ts` /
  `src/common/startup/startup-banner.ts`.

---

## 12. Observability

- **OpenTelemetry** (`src/common/observability/otel.ts`) — tracing, off by default (`OTEL_ENABLED=false`),
  disiapkan untuk integrasi Grafana/Tempo di masa depan lewat OTLP HTTP exporter (`OTEL_EXPORTER_OTLP_ENDPOINT`).
  Harus di-start sebelum modul yang diinstrumentasi (fastify, mysql2, dst) diimpor — lihat urutan import di
  `main.ts`. **Catatan**: sebagian auto-instrumentation Node punya keterbatasan kompatibilitas di bawah Bun.
- **Startup connectivity check & banner** — `main.ts` mengecek koneksi MySQL (wajib, fatal kalau gagal), Redis,
  dan RabbitMQ (opsional, warning saja) lewat `withSpinner()` (Ora spinner di development,
  `src/common/startup/startup-banner.ts`). Setelah `app.listen()`, `printStartupBanner()` mencetak ringkasan:
  header Boxen (nama, versi dari `package.json`, environment, commit — dari env `GIT_COMMIT_SHA` atau live
  `git rev-parse --short HEAD`, fallback `"unknown"`), tabel status dependency (cli-table3, diwarnai Chalk), dan
  daftar URL (App, Docs, Healthcheck, BullMQ Board, RabbitMQ Management).
- **Healthcheck** — `GET /health` (root, di luar `/api`) melakukan deep check tiap request: MySQL wajib
  (`503` kalau gagal), Redis & RabbitMQ opsional (dilaporkan `up`/`down`, tidak menggagalkan response). Dipakai
  oleh `docker/docker-compose.yml` sebagai Docker healthcheck service `app`. Lihat
  `src/common/plugins/health.plugin.ts`.
- **Graceful shutdown** — `SIGINT`/`SIGTERM` menutup Fastify (drain koneksi aktif), lalu pool MySQL, koneksi
  Redis, koneksi RabbitMQ, dan OpenTelemetry secara berurutan sebelum proses keluar.

---

## 13. Background Jobs & Message Broker

- **BullMQ** (`src/common/queue/queue.service.ts`) menyediakan `createQueue()`/`createWorker()` generik untuk
  modul manapun yang butuh background job.
- **Laporan bulanan** (`src/common/jobs/monthly-report.job.ts`): job BullMQ repeatable (`MONTHLY_REPORT_CRON`,
  default tanggal 1 tiap bulan) yang mengagregasi total transaksi & revenue bulan lalu, dicatat lewat Pino.
- **Bull Board dashboard** (`GET /api/admin/queues`, `src/common/plugins/bull-board.plugin.ts`) — monitoring UI
  untuk semua queue/job. Digerbang dengan **HTTP Basic Auth** (`basicAuthGuard`,
  `BULL_BOARD_USERNAME`/`BULL_BOARD_PASSWORD`) alih-alih JWT bearer seperti route API lain, karena dashboard ini
  dibuka langsung di browser dan tidak bisa menempelkan header `Authorization: Bearer` saat navigasi biasa —
  Basic Auth membuat browser menampilkan prompt login native.
- **RabbitMQ** (`src/common/rabbitmq/rabbitmq.service.ts`) menyediakan `publish()` dan `consume()`.
  `startExampleConsumer()` adalah contoh nyata bahwa service ini bisa menerima pesan dari publisher eksternal —
  panggil fungsi serupa dari modul lain saat dibutuhkan.

---

## 14. Testing

### Framework

- **bun test** (API kompatibel Jest) untuk test runner.
- Helper `src/common/testing/test-app.ts` untuk membangun Fastify instance ter-isolasi per modul dan melakukan
  HTTP request via `fetch()` asli (bukan `.inject()` bawaan Fastify — lihat catatan kompatibilitas Bun di
  `AGENTS.md`).

### Aturan Testing

- File test colocated di dalam masing-masing modul: `src/modules/<modul>/<modul>.test.ts`.
- Jalankan semua test: `bun test`
- Repository di-mock mengikuti interface modul — service/route diuji tanpa database sungguhan.
- Setiap endpoint **WAJIB** memiliki minimal test untuk: unauthorized (401), forbidden/role mismatch (403/409),
  validation error (400), success (200/201), not found (404). Body/response test tetap memakai key Bahasa
  Indonesia karena itu kontrak API-nya.

---

## 15. Development Workflow

### Menjalankan Server

```bash
bun run dev     # Development (hot-reload via bun --watch)
bun run start   # Production
```

### Docker

```bash
docker compose -f docker/docker-compose.yml up --build
```

### Git Workflow

- Branch `master` — branch utama/production.
- Branch `refactor` — refactoring kode.
- **JANGAN** push langsung ke `master` tanpa review.

### Scripts yang Tersedia

| Script               | Perintah                     | Keterangan                        |
|----------------------|-------------------------------|------------------------------------|
| `bun run dev`        | `bun --watch src/main.ts`     | Jalankan dev server (hot-reload)   |
| `bun run start`      | `bun src/main.ts`             | Jalankan production server         |
| `bun run typecheck`  | `tsc --noEmit`                | Cek type error                     |
| `bun run lint`       | `eslint .`                    | Jalankan ESLint                    |
| `bun run format`     | `biome format --write .`      | Format kode dengan Biome           |
| `bun test`           | `bun test`                    | Jalankan test suite                |
| `bun run db:generate`| `drizzle-kit generate`        | Generate migration dari schema     |
| `bun run db:migrate` | `bun run database/migrate.ts` | Jalankan migration                 |
| `bun run db:seed`    | `bun run database/seed.ts`    | Jalankan seeder                    |

---

## 16. Dependency Management

- Selalu gunakan `bun install` untuk mengelola dependencies.
- **JANGAN** menambahkan dependency baru tanpa alasan yang jelas.
- Pastikan `bun.lock` selalu di-commit.
- Dependency yang hanya digunakan saat development masuk ke `devDependencies`.

### Dependencies Utama

| Package                        | Fungsi                              |
|---------------------------------|--------------------------------------|
| fastify                         | Web framework                       |
| drizzle-orm / drizzle-kit       | ORM & migration tool                |
| mysql2                          | MySQL driver (pooled)               |
| zod / fastify-type-provider-zod | Validasi & DTO                      |
| @fastify/jwt                    | JWT authentication                  |
| bcryptjs                        | Password hashing                    |
| @fastify/helmet / cors / rate-limit / compress | Security headers, CORS, rate limit, compression |
| @fastify/swagger / @scalar/fastify-api-reference | Dokumentasi API |
| ioredis                         | Redis client                        |
| amqplib                         | RabbitMQ client                     |
| bullmq                          | Background job queue                |
| @sentry/node                    | GlitchTip error capturing           |
| @opentelemetry/*                | Tracing (off by default)            |
| pino / pino-pretty (dev)        | Logging (pino-pretty hanya devDependency) |
| chalk / boxen / cli-table3 / ora | Startup banner (warna, header, tabel dependency, spinner dev) |

---

## 17. Diagram Arsitektur Sistem

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   CLIENT    │────▶│ FASTIFY APP  │────▶│    MySQL      │
│  (Postman)  │◀────│  (Port 8080) │◀────│  (db_market)  │
└─────────────┘     └──────┬───────┘     └──────────────┘
                           │
         ┌─────────────────┼─────────────────┬──────────────┐
         ▼                 ▼                 ▼              ▼
   ┌──────────┐     ┌──────────────┐   ┌──────────┐   ┌────────────┐
   │ Helmet / │     │ Rate Limiter │   │ Redis /  │   │ GlitchTip /│
   │ CORS /   │     │ (global +    │   │ RabbitMQ │   │ OpenTelemetry│
   │ Compress │     │  auth ketat) │   │ / BullMQ │   └────────────┘
   └──────────┘     └──────────────┘   └──────────┘
         │
         ▼
   ┌──────────────────────────────────┐
   │           ROUTER (/api)          │
   ├──────────┬───────────┬───────────┤
   │ /auth    │ /produks  │ /dompets  │
   │ /transaksi │ /docs   │           │
   └──────────┴───────────┴───────────┘
         │
    ┌────┼────┐
    ▼    ▼    ▼
┌────────┐ ┌────────┐ ┌──────────┐
│  Auth  │ │ Role   │ │  Zod     │
│ Guard  │ │ Guard  │ │ Schema   │
└────────┘ └────────┘ └──────────┘
         │
         ▼
   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐
   │  CONTROLLER  │───▶│   SERVICE    │───▶│  REPOSITORY  │───▶│  MAPPER  │
   └──────────────┘    └──────────────┘    └──────────────┘    └──────────┘
```

---

## 18. Checklist Sebelum Commit

- [ ] Kode sudah mengikuti naming convention yang ditetapkan (identifier Inggris, kontrak API tetap Indonesia)
- [ ] Tidak ada `console.log` di kode aplikasi (gunakan Pino logger)
- [ ] Tidak ada akses `process.env` langsung di luar `common/config/env.ts`
- [ ] Business logic ada di service layer, akses data lewat repository
- [ ] Error bisnis terduga dilempar sebagai `AppError` subclass
- [ ] Response mengikuti format JSON yang konsisten dan field JSON eksternal tidak berubah
- [ ] Route baru sudah punya `schema` Zod lengkap (otomatis muncul di `/api/docs`)
- [ ] Guard auth dan role sudah diterapkan sesuai kebutuhan
- [ ] Perubahan skema database menggunakan migration (`bun run db:generate` + `db:migrate`)
- [ ] Test case sudah ditambahkan/diperbarui, `bun test` hijau
- [ ] `bun run typecheck`, `bun run lint`, `bun run format:check` lolos
- [ ] File `.env` **TIDAK** ter-commit
- [ ] `bun.lock` sudah di-commit jika ada perubahan dependency

---

> **Terakhir diperbarui:** Juli 2026
> **Author:** Huda Putra Santosa

Karena Anda menggunakan **Docker Hub**, saya akan jelaskan alur yang umum dipakai di perusahaan. Prinsipnya adalah:

> **Build → Tag → Push → Deploy**

Jangan build image berbeda untuk staging dan production. Build **sekali**, push ke Docker Hub, lalu kedua environment melakukan `docker pull` image yang sama.

---

# Struktur Repository

Misalnya:

```text
be-node-marketplace-api/
├── Dockerfile
├── docker-compose.yml
├── package.json
└── ...
```

Repository Docker Hub Anda:

```text
hudaputrasantosa/be-node-marketplace-api
```

---

# Step 1. Login ke Docker Hub

```bash
docker login
```

Masukkan:

```text
Username : hudaputrasantosa
Password : ********
```

Cek:

```bash
docker info
```

Harus muncul username Anda.

---

# Step 2. Build Image

Misalnya versi pertama:

```bash
docker build \
-t hudaputrasantosa/be-node-marketplace-api:v1.0.0 .
```

Lihat image:

```bash
docker images
```

Output:

```text
REPOSITORY                              TAG
hudaputrasantosa/be-node-marketplace-api v1.0.0
```

---

# Step 3. Push ke Docker Hub

```bash
docker push hudaputrasantosa/be-node-marketplace-api:v1.0.0
```

Selesai.

Di Docker Hub akan muncul:

```text
hudaputrasantosa/
└── be-node-marketplace-api
      └── v1.0.0
```

---

# Step 4. Pull di Server

Staging

```bash
docker pull hudaputrasantosa/be-node-marketplace-api:v1.0.0
```

Production

```bash
docker pull hudaputrasantosa/be-node-marketplace-api:v1.0.0
```

Image sama persis.

---

# Best Practice Semantic Versioning

Gunakan **Semantic Versioning (SemVer)**:

```text
MAJOR.MINOR.PATCH
```

Contoh:

```text
v1.0.0
```

---

## PATCH

Perbaikan bug.

```text
v1.0.0

↓

v1.0.1

↓

v1.0.2
```

Contoh:

* fix login
* fix pagination
* fix typo
* optimize query

---

## MINOR

Menambah fitur tanpa breaking change.

```text
v1.0.0

↓

v1.1.0

↓

v1.2.0
```

Misalnya:

* tambah endpoint wishlist
* tambah payment
* tambah search

---

## MAJOR

Breaking change.

```text
v1.0.0

↓

v2.0.0
```

Misalnya:

* response API berubah
* endpoint berubah
* JWT berubah
* database migration besar

---

# Jangan hanya menggunakan `latest`

Banyak pemula hanya memiliki:

```text
latest
```

Ini tidak disarankan untuk deployment karena tidak jelas versi mana yang sedang dijalankan.

Lebih baik:

```text
v1.0.0
v1.0.1
v1.1.0
v2.0.0
```

---

# Apakah `latest` boleh?

Boleh, tetapi hanya sebagai alias.

Contoh:

```bash
docker tag \
hudaputrasantosa/be-node-marketplace-api:v1.0.0 \
hudaputrasantosa/be-node-marketplace-api:latest
```

Push:

```bash
docker push hudaputrasantosa/be-node-marketplace-api:latest
```

Maka repository akan memiliki:

```text
v1.0.0

latest
```

`latest` menunjuk ke image yang sama.

---

# Best Practice Tagging

Saya menyarankan setiap build memiliki **minimal dua tag**:

```text
v1.2.3

latest
```

Lebih profesional lagi:

```text
v1.2.3

latest

sha-ae71b42
```

Misalnya:

```bash
docker build \
-t hudaputrasantosa/be-node-marketplace-api:v1.2.3 \
-t hudaputrasantosa/be-node-marketplace-api:latest \
-t hudaputrasantosa/be-node-marketplace-api:sha-ae71b42 .
```

Kemudian push semuanya:

```bash
docker push hudaputrasantosa/be-node-marketplace-api:v1.2.3
docker push hudaputrasantosa/be-node-marketplace-api:latest
docker push hudaputrasantosa/be-node-marketplace-api:sha-ae71b42
```

Keuntungannya:

* `v1.2.3` → untuk deployment yang stabil.
* `latest` → memudahkan pengembangan lokal.
* `sha-ae71b42` → memudahkan pelacakan ke commit Git tertentu.

---

# Deployment

Misalnya server production.

Jangan:

```bash
docker pull hudaputrasantosa/be-node-marketplace-api:latest
```

Lebih baik:

```bash
docker pull hudaputrasantosa/be-node-marketplace-api:v1.2.3
```

Lalu:

```bash
docker run \
-d \
--name marketplace-api \
--env-file .env \
-p 3000:3000 \
hudaputrasantosa/be-node-marketplace-api:v1.2.3
```

Rollback pun mudah:

```bash
docker pull hudaputrasantosa/be-node-marketplace-api:v1.2.2

docker run ...
```

---

# Alur Release yang Direkomendasikan

```text
Git Commit
      │
      ▼
CI/CD Build Image
      │
      ▼
Tag:
v1.3.0
latest
sha-a1b2c3d
      │
      ▼
Push Docker Hub
      │
      ▼
Deploy Staging
      │
      ▼
QA Testing
      │
      ▼
Approve
      │
      ▼
Deploy Production (image yang sama)
```

## Untuk project backend yang akan digunakan secara profesional

Saya merekomendasikan kombinasi tag berikut:

| Tag                   | Tujuan                      | Digunakan untuk deployment?        |
| --------------------- | --------------------------- | ---------------------------------- |
| `v1.0.0`              | Rilis resmi (SemVer)        | ✅ Ya                               |
| `sha-<git-short-sha>` | Traceability ke commit Git  | Opsional                           |
| `latest`              | Kemudahan development/lokal | ❌ Sebaiknya tidak untuk production |

Dengan strategi ini, Anda mendapatkan:

* **Versi yang jelas** untuk setiap rilis.
* **Rollback** yang mudah ke versi sebelumnya.
* **Traceability** dari image ke commit Git.
* **Proses CI/CD** yang sesuai dengan praktik umum di lingkungan profesional.

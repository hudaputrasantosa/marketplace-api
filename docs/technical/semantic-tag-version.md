Secara umum, **Docker image sebaiknya mengikuti Semantic Versioning (SemVer)** yang sama dengan versi aplikasi Anda. Ini adalah praktik yang paling umum di perusahaan karena memudahkan deployment, rollback, dan audit.

## 1. Semantic Versioning (Paling Direkomendasikan)

Format:

```text
MAJOR.MINOR.PATCH
```

Contoh:

```text
v1.0.0
v1.0.1
v1.0.2
v1.1.0
v1.2.0
v2.0.0
```

Aturan perubahan:

| Perubahan | Contoh   | Kapan digunakan                              |
| --------- | -------- | -------------------------------------------- |
| PATCH     | `v1.0.1` | Bug fix, optimasi, tidak mengubah API        |
| MINOR     | `v1.1.0` | Menambah fitur baru yang backward compatible |
| MAJOR     | `v2.0.0` | Breaking change, perubahan API atau behavior |

Contoh:

```
v1.0.0  Initial Release
v1.0.1  Fix login bug
v1.0.2  Improve performance
v1.1.0  Add payment feature
v1.2.0  Add notification
v2.0.0  New API Version
```

---

# 2. Jangan hanya menggunakan `latest`

Hindari deployment production seperti:

```text
backend-api:latest
```

Karena:

* Tidak jelas versi yang sedang berjalan.
* Sulit rollback.
* Tidak reproducible.

`latest` bukan berarti versi terbaru, melainkan hanya tag bernama `latest`.

Misalnya:

```
latest → v1.2.5

besok

latest → v1.3.0
```

Server yang melakukan pull hari ini dan besok bisa menjalankan versi berbeda.

---

# 3. Gunakan beberapa tag untuk satu image

Saat build satu image, Anda bisa memberikan beberapa tag.

Misalnya versi:

```
v1.4.2
```

Tag yang bisa diberikan:

```
v1.4.2
v1.4
v1
latest
```

Semuanya menunjuk ke image (digest) yang sama.

Contoh:

```bash
docker build -t backend-api .

docker tag backend-api myrepo/backend-api:v1.4.2
docker tag backend-api myrepo/backend-api:v1.4
docker tag backend-api myrepo/backend-api:v1
docker tag backend-api myrepo/backend-api:latest

docker push --all-tags myrepo/backend-api
```

Artinya:

```
v1.4.2  -> fixed version
v1.4    -> latest patch di minor 1.4
v1      -> latest major version
latest  -> release terbaru
```

Untuk deployment production, tetap gunakan tag yang spesifik (`v1.4.2`), bukan `latest`.

---

# 4. Tambahkan Commit SHA

Di banyak perusahaan, image juga diberi tag commit Git.

Contoh:

```
v1.4.2
sha-3fa12cd
```

atau

```
v1.4.2-3fa12cd
```

Keuntungannya:

* Mudah mengetahui image berasal dari commit mana.
* Sangat membantu saat debugging.

Contoh pipeline:

```
Git Commit
3fa12cd

↓

Docker Image

backend-api:v1.4.2
backend-api:sha-3fa12cd
```

---

# 5. Tag berdasarkan Branch (Opsional)

Untuk environment non-production, Anda bisa memakai tag branch.

Contoh:

```
develop
staging
main
```

atau

```
develop-3fa12cd
staging-a8129bc
```

Namun, jangan gunakan tag ini sebagai satu-satunya referensi deployment karena sifatnya berubah-ubah.

---

# 6. Contoh strategi tag yang umum

Misalkan Anda merilis versi `1.8.3`.

Image yang sama bisa memiliki tag:

```
backend-api:v1.8.3
backend-api:v1.8
backend-api:v1
backend-api:latest
backend-api:sha-a7d91bc
```

Semuanya menunjuk ke digest yang sama.

---

# 7. Untuk CI/CD

Misalnya menggunakan GitHub Actions.

Saat build:

```
Build Image

↓

backend-api:v1.8.3

↓

Push

↓

Docker Registry
```

Deploy:

**Staging**

```
docker pull backend-api:v1.8.3
```

Setelah QA lolos:

**Production**

```
docker pull backend-api:v1.8.3
```

Tidak ada build ulang.

---

# Rekomendasi untuk startup hingga enterprise

Saya biasanya menyarankan kombinasi berikut:

| Tag           | Digunakan untuk                | Deploy Production? |
| ------------- | ------------------------------ | ------------------ |
| `v1.4.2`      | Versi resmi (SemVer)           | ✅ Ya               |
| `sha-a1b2c3d` | Traceability ke Git            | Opsional           |
| `latest`      | Kemudahan development          | ❌ Tidak disarankan |
| `develop`     | Environment development        | ❌ Tidak            |
| `staging`     | Environment staging (opsional) | ❌ Tidak            |

## Praktik yang banyak digunakan

Untuk setiap release:

```
backend-api:v1.4.2
backend-api:sha-a1b2c3d
backend-api:latest
```

Lalu:

* **Development** boleh menggunakan `latest` untuk kemudahan.
* **Staging** dan **Production** selalu menggunakan **tag versi yang immutable**, misalnya `v1.4.2`.

Dengan cara ini Anda mendapatkan:

* **Rollback** yang mudah (`v1.4.1` → `v1.4.0`).
* **Traceability** ke commit Git melalui tag SHA.
* **Deployment yang reproducible**, karena image yang dijalankan selalu identik dengan yang telah diuji.

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

| Method   | Url/Endpoint   | Action   |
| ------------- | ------------- | -------- |
| POST      | /auth/daftar       | Daftar Akun |
| POST      | /auth/masuk | Masuk Sistem |
| POST      | /auth/keluar       | Keluar sistem  |
| GET      | /produks      | lihat semua data produk |
| GET      | /produks/{id}     | lihat 1 data produk  |
| POST      | /produks/tambah       | membuat produk  |
| PUT      | /produks/ubah/{id}      | memperbaharui produk |
| DELETE      | /produks/hapus/{id}     | menghapus produk  |
| GET      | /dompets/detail     | melihat detail dompet  |
| POST      | /dompets/tambah     | membuat dompet  |
| POST      | /dompets/setor-saldo     | setor saldo  |
| POST      | /dompets/tarik-saldo    | tarik saldo  |
| GET      | /transaksi/riwayat    | melihat riwayat transaksi |
| POST      | /transaksi/buat-transaksi    | membuat transaksi  |


## ✅ Requirement and tools
 - NodeJS v16.16
 - NPM v8.11
 - DBMS MySQL
 - Express
 - Sequelize ORM
 - Jest
 - Winston Logger
 - Swagger Documentation
 - Exalidraw

## 🔥 Install & running local dev
Clone Repository

```bash
git clone https://github.com/hudaputrasantosa/marketplace-api.git
cd marketplace-api
```
Installation from NPM
```bash
npm install
```
Create migration table
```bash
npx sequelize-cli db:migrate
```
Seeders data
```bash
npx sequelize-cli db:seed:all
```
Running server
```bash
npm run dev
```



# Database Migration dan Seeder SILABLING

Struktur ini memakai migration per domain, bukan satu dump besar. Migration hanya berisi struktur tabel, primary key, index, dan foreign key. Seeder hanya berisi data awal yang dibutuhkan sistem.

## Perintah

```bash
npm run db:migrate
npm run db:seed
npm run db:setup
npm run db:status
```

`db:setup` akan membuat database, menjalankan seluruh migration, lalu menjalankan seeder.

## Database

Default `.env.example` memakai:

```env
DB_NAME=silabling.lab
```

Nama database yang mengandung titik aman dipakai karena runner membuat database dengan backtick. Di konfigurasi koneksi, cukup tulis `silabling.lab`.

## Akun awal

Password default diatur oleh:

```env
SEED_DEFAULT_PASSWORD=Silabling@2026
```

Akun awal:

- `admin`
- `kasi`
- `penyelia`
- `analis`
- `qc`
- `kalab`

## Isi seeder

Seeder hanya memuat:

- role
- akun pegawai inti
- pegawai inti, termasuk Kasubag TU, Pengelola Sampel Pengujian, dan PCC
- tipe notifikasi TN001 sampai TN030
- master jenis sampel, parameter, metode, baku mutu, tarif, dan paket baku mutu

Seeder tidak memuat data transaksi seperti permohonan FPPL, invoice, payment, jadwal, sampel, LKA, LHU, notifikasi user, atau workflow log.

## Catatan migrasi

Migration ini ditujukan untuk database kosong. Untuk database yang sudah berisi data, backup dulu dan jangan jalankan migration ini langsung di database produksi.

Script checker buatan patch sebelumnya dan `.npmrc` sudah dihapus dari paket clean. Script npm backend dibuat minimal untuk menjalankan server dan database setup.

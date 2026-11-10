# PRD dan Task Card Modul Logistik (`/logistik`)

MVP Web App F&B Multi-Modul · Draft 10 Nov 2026 · Pemutus: manusia

**Status:** draft kerja. G0 belum lolos, kontrak data belum beku. Semua yang bergantung wedge berlabel **\[HIPOTESIS\]**. Nama tabel/kolom adalah usulan, bukan kontrak.

## 0. Celah yang diketahui (tidak memblokir draf ini)

| # | Celah | Perlakuan di dokumen ini |
| --- | --- | --- |
| 1 | T1, T2, T3 belum dijalankan; wedge belum teruji | Fitur wedge (B1 sampai B4, B8) ditandai menunggu G0. Fase 8 ke atas tetap terkunci |
| 2 | Dokumen Tahap 0 asli belum terlampir | Ambang mengikuti master prompt |
| 3 | Skema Prisma/Zod belum beku (Fase 4) | Nama entitas di bawah = usulan; task L-01 menghasilkan draf kontrak untuk direview |
| 4 | **Konflik arsitektur:** master prompt mengunci Next.js + Supabase + Vercel; `rekomendasi_arsitektur.md` mengusulkan Node.js di VPS untuk `/logistik`. Belum ada ADR | Semua task ditulis agnostik: logika di lapisan service TypeScript yang bisa dipindah. Butuh ADR-0002 sebelum L-03 |
| 5 | Apakah pemilik mau isi stok tiap pagi | \[HIPOTESIS\]; diuji T2 (A3) dan T3 |
| 6 | Aturan "sisa kemarin": dibawa ke hari ini atau reset | Asumsi: reset per `business_date`; sisa dicatat sebagai rekap. Pertanyaan terbuka #2 |
| 7 | Siapa pemakai `/logistik` di warung 2 sampai 6 orang | Asumsi: pemilik/pengelola; kasir hanya lihat sisa \[HIPOTESIS\] |
| 8 | Klaim vendor, pajak, provider QRIS | Di luar modul ini |

## 1. Ringkasan produk

**Tujuan:** pemilik warung mengisi jumlah porsi tiap menu di pagi hari dalam kurang dari 3 menit, memantau sisa sepanjang hari, dan menutup hari dengan rekap (terjual, sisa, terbuang). Angka yang diisi di sini menjadi sumber kebenaran ketersediaan menu di halaman customer (menu otomatis HABIS).

**Bukan tujuan (non-goals):** pembelian bahan, supplier, PO (V3), HPP/resep (V2 provisional), stock opname terjadwal dan peringatan menipis (V2), multi-gudang, mode offline.

**Pengguna:** Pemilik/pengelola (utama), kasir (lihat sisa, koreksi terbatas bila diizinkan), admin sistem.

## 2. Cakupan per milestone

| ID | Fitur | Kelas | MS | Catatan |
| --- | --- | --- | --- | --- |
| B1 | Ledger stok append-only, `stock_item` bertipe `portion` | MVP | skema M0, logika M2 | Menunggu G0 |
| B2 | Isi stok pagi + "salin stok kemarin" | MVP | M2 | Provisional sesuai T3 |
| B3 | Reservasi stok TTL, anti-oversell | MVP | M2 | Area wajib review |
| B4 | Fungsi ketersediaan tunggal + toggle HABIS manual | MVP | M2 | Satu sumber kebenaran |
| B7 | Koreksi stok dan catat terbuang dengan alasan | MVP | M4 | Tipe movement sudah ada di skema M0 |
| B8 | Rekap akhir hari | MVP | M4 | Bukti nilai bagi pemilik |
| B9 | Mode Resep | V2 provisional |  | Tidak boleh disentuh Mode Porsi |
| B11 | Peringatan menipis, opname terjadwal | V2 |  |  |

## 3. Persyaratan fungsional

### 3.1 Isi stok pagi (M2)

- FR-1: Layar menampilkan semua menu aktif dengan satu isian angka porsi (bilangan bulat 0 sampai 9999) dan satu tombol Simpan.
- FR-2: Tombol "Salin stok kemarin" mengisi semua isian dengan nilai awal hari kemarin; nilai tetap bisa diubah sebelum Simpan.
- FR-3: Simpan memicu satu panggilan server yang menulis movement untuk semua menu dalam satu transaksi (semua berhasil atau tidak sama sekali).
- FR-4: Mengisi ulang di hari yang sama menghasilkan movement koreksi dengan selisih yang dihitung server; tidak ada baris yang ditimpa.
- FR-5: Menu tanpa isian dianggap tidak dilacak (selalu tersedia kecuali toggle HABIS manual) \[HIPOTESIS\]; ditandai jelas di UI.
- FR-6: Target uji T3: 10 menu terisi dalam 3 menit tanpa bantuan.

### 3.2 Lihat sisa (M2)

- FR-7: Daftar menu dengan: stok awal, terjual/terpesan, tertahan (reservasi aktif), tersedia.
- FR-8: Pembaruan realtime saat order masuk; pulih otomatis saat koneksi kembali.
- FR-9: Toggle HABIS manual per menu; menu manual-habis tidak bisa dipesan walau stok > 0. Toggle memakai fungsi ketersediaan yang sama.

### 3.3 Ketersediaan dan reservasi (M2)

- FR-10: Satu fungsi `getAvailability(menuItemId, businessDate)` = stok awal + penyesuaian − terjual − reservasi aktif; bernilai 0 atau menu manual-habis berarti HABIS. Tidak ada salinan aturan di tempat lain.
- FR-11: Saat order dibuat, reservasi dibuat atomik dengan TTL; pesanan tidak bisa menyebabkan saldo negatif.
- FR-12: Reservasi dilepas saat TTL habis, order dibatalkan, atau bayar gagal; menjadi movement terjual saat order sah (aturan mengikuti state machine Fase 2).
- FR-13: Dua order bersamaan untuk porsi terakhir: hanya satu berhasil, yang lain menerima pesan "Menu habis".

### 3.4 Koreksi dan terbuang (M4)

- FR-14: Koreksi stok (tambah/kurang) wajib alasan dari daftar tetap + catatan bebas opsional.
- FR-15: Catat terbuang: menu, jumlah, alasan (basi, salah masak, tumpah, lainnya).
- FR-16: Koreksi dan terbuang tidak bisa diedit/dihapus; salah input dibalik dengan movement baru.
- FR-17: Setiap koreksi tercatat di audit log (siapa, kapan, nilai sebelum/sesudah).

### 3.5 Rekap akhir hari (M4)

- FR-18: Per menu: stok awal, terjual, terbuang, koreksi, sisa. Total per hari.
- FR-19: Rekap bisa dibuka untuk 30 hari terakhir \[HIPOTESIS\]; tanpa ekspor CSV (V2).
- FR-20: Angka rekap berasal dari ledger yang sama; tidak ada tabel ringkasan yang ditimpa.

## 4. Aturan bisnis

1. Ledger append-only; saldo selalu turunan.
2. Semua mutasi stok lewat satu service (`StockService`); UI dan route tidak menulis movement langsung.
3. Jumlah selalu bilangan bulat; tidak ada desimal pada Mode Porsi.
4. Validasi Zod di batas request; semua perhitungan di server.
5. `outlet_id` pada setiap baris; RLS aktif.
6. Mode Porsi tidak membaca atau menulis tabel resep.

## 5. Usulan model data (draf kontrak, belum beku)

- `stock_item`: id, outlet\_id, type (`portion`|`ingredient`), name, unit, is\_active.
- `menu_stock_link`: menu\_item\_id, stock\_item\_id (tabel terpisah agar Mode Resep nanti menambah tabel, bukan mengubah ini).
- `stock_movement`: id, outlet\_id, stock\_item\_id, business\_date, type (`opening`|`adjustment`|`sale`|`waste`|`reversal`), qty (integer bertanda), reason, note, order\_id nullable, idempotency\_key unik, created\_by, created\_at.
- `stock_reservation`: id, outlet\_id, stock\_item\_id, order\_id, qty, status (`active`|`released`|`committed`|`expired`), expires\_at.
- `menu_availability_override`: menu\_item\_id, is\_sold\_out\_manual, updated\_by, updated\_at.
- Indeks: (outlet\_id, stock\_item\_id, business\_date), (status, expires\_at).

## 6. Hak akses (usulan)

| Aksi | Pemilik/admin | Logistik | Kasir | Dapur | Customer |
| --- | --- | --- | --- | --- | --- |
| Isi stok pagi | ya | ya | tidak | tidak | tidak |
| Lihat sisa | ya | ya | ya | ya | hanya status tersedia/habis |
| Toggle HABIS manual | ya | ya | ya | tidak | tidak |
| Koreksi/terbuang | ya | ya | tidak \[HIPOTESIS\] | tidak | tidak |
| Rekap | ya | ya | tidak | tidak | tidak |

Akses lintas outlet harus ditolak oleh RLS.

## 7. Persyaratan non-fungsional

- Mobile-first, WCAG AA, Bahasa Indonesia, ringan untuk Android lama; target tap minimum 44 px; input numerik memakai keypad angka.
- Realtime tetap terbaca saat koneksi putus dan tersambung lagi (tampilkan penanda "Menyambung ulang").
- Latensi Simpan stok pagi: target di bawah 2 detik untuk 30 menu \[HIPOTESIS, diukur di M2\].
- Log terstruktur dan audit log untuk aksi sensitif.
- Online-only; tidak ada sinkronisasi offline.

## 8. Keadaan kosong, error, dan teks

| Situasi | Teks Bahasa Indonesia |
| --- | --- |
| Belum ada menu | "Belum ada menu. Tambahkan menu dulu di Admin." |
| Stok hari ini belum diisi | "Stok hari ini belum diisi. Isi sekarang agar menu otomatis habis." |
| Simpan gagal | "Stok belum tersimpan. Coba lagi." (isian tetap dipertahankan) |
| Koneksi putus | "Tidak ada koneksi. Perubahan belum tersimpan." |
| Angka tidak valid | "Isi angka 0 sampai 9999." |
| Stok diubah perangkat lain | "Stok baru saja diubah orang lain. Muat ulang." |

## 9. Metrik keberhasilan (semua \[HIPOTESIS\])

- Waktu isi stok pagi 10 menu: median di bawah 3 menit (T3).
- Hari dengan stok terisi dibanding hari buka selama pilot.
- Kejadian oversell di pilot: 0 (dibuktikan test konkurensi dan log).
- Jumlah koreksi manual per minggu (indikasi akurasi input).

## 10. Risiko

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Pemilik berhenti mengisi stok | Wedge gagal | "Salin stok kemarin", T3, fallback toggle HABIS manual |
| Race condition reservasi | Oversell | Transaksi + kunci baris/advisory lock; test konkurensi; review manusia |
| TTL salah | Stok tertahan atau oversell | TTL dapat dikonfigurasi; test kedaluwarsa |
| Skema berubah setelah beku | Kerja ulang | Kontrak melalui ADR |
| Konflik arsitektur Vercel vs VPS | Task terpindah | ADR-0002 sebelum L-03; service agnostik |

## 11. Pertanyaan terbuka untuk manusia

1. Putuskan ADR-0002: logika `/logistik` di Next.js/Vercel atau Node.js di VPS (catatan: Vercel Hobby tidak untuk pemakaian komersial \[BELUM TERVERIFIKASI dari sumber resmi\]).
2. Sisa hari kemarin: reset atau dibawa?
3. TTL reservasi default (usulan awal 10 menit, perlu diuji dengan alur bayar).
4. Apakah kasir boleh koreksi stok di warung tanpa staf logistik?
5. Apakah menu tanpa isian dianggap tidak dilacak atau dianggap 0?

## 12. Task card

Format mengikuti template tugas. Semua task: Definition of Done sesuai Bagian 6 master prompt; PR kecil; masalah di luar scope dicatat, tidak diperbaiki diam-diam. **Jika ada yang ambigu atau bertentangan dengan kontrak: BERHENTI dan tanyakan.**

Urutan dan dependensi:

`L-01 → L-02 → L-03 → L-04 → L-05 → (L-06, L-07, L-08) → L-09 → L-10 → L-11 → (L-12, L-13) → L-14 → L-15`

### L-01 Draf kontrak data stok (M0 / B)

- **Konteks:** menyiapkan skema ledger untuk contract freeze Fase 4.
- **Kontrak:** belum beku; task ini menghasilkan usulan.
- **AC:**
  - Given skema Bagian 5 When diulas Then ada Prisma model + Zod schema untuk 5 entitas dan enum type/status.
  - Given movement dengan idempotency\_key sama When ditulis dua kali Then tabel menolak duplikat.
  - Given qty non-integer When divalidasi Then Zod menolak.
- **Batas file:** boleh `prisma/schema` (bagian stok), `packages/contracts/stock/*`; dilarang tabel order/bill/payment.
- **Aturan bisnis:** integer, append-only, outlet\_id wajib.
- **Test:** unit Zod; migrasi naik/turun.
- **Review manusia:** ya (migrasi, kontrak).
- **Di luar scope:** resep, bahan baku.

### L-02 Kebijakan RLS tabel stok (M0 / B)

- **Konteks:** data stok per outlet harus terisolasi.
- **AC:**
  - Given pengguna outlet A When query stok outlet B Then 0 baris/ditolak.
  - Given role kasir When insert `waste` Then ditolak.
  - Given customer anon When baca stok mentah Then ditolak; hanya endpoint ketersediaan publik.
  - Given UPDATE/DELETE pada `stock_movement` When dicoba role mana pun Then ditolak.
- **Batas file:** migrasi RLS stok; dilarang tabel lain.
- **Test:** RLS per role + lintas outlet.
- **Review manusia:** **ya, wajib** (RLS/RBAC).

### L-03 `StockService` inti: ledger dan saldo (M2 / B)

- **Dependensi:** L-01, ADR-0002.
- **AC:**
  - Given stok awal 20 dan terjual 5 When hitung saldo Then 15.
  - Given dua movement dengan idempotency\_key sama When diproses Then satu tercatat.
  - Given business\_date berbeda When hitung saldo Then terpisah per tanggal.
- **Batas file:** `services/stock/*`; dilarang UI dan route.
- **Aturan:** satu titik mutasi stok; saldo turunan.
- **Test:** unit tanpa UI, termasuk tanggal batas tengah malam zona WIB \[HIPOTESIS WIB\].
- **Review manusia:** ya (konkurensi).

### L-04 `setDailyStock` (isi stok pagi) (M2 / B)

- **AC:**
  - Given 10 menu dengan angka valid When setDailyStock Then 10 movement `opening` tertulis atomik.
  - Given satu angka tidak valid When dikirim Then tidak ada yang tersimpan, error per baris.
  - Given stok sudah diisi hari ini When diisi ulang Then movement `adjustment` dengan selisih; baris lama utuh.
  - Given "salin kemarin" When dipanggil Then nilai awal kemarin dikembalikan sebagai usulan, belum tersimpan.
- **Batas file:** `services/stock/daily.ts`, `app/api/logistik/stock/*`.
- **Test:** unit + integrasi transaksi gagal sebagian.
- **Review manusia:** tidak (kecuali menyentuh kunci/konkurensi).

### L-05 Reservasi stok dengan TTL (M2 / B)

- **AC:**
  - Given sisa 1 When dua order bersamaan Then satu reservasi `active`, satu ditolak "Menu habis".
  - Given reservasi melewati TTL When job pelepas jalan Then status `expired` dan stok tersedia kembali.
  - Given order dibatalkan When rilis Then reservasi `released`.
  - Given order sah (sesuai state machine) When commit Then movement `sale` tertulis dan reservasi `committed`, tanpa pengurangan ganda.
- **Batas file:** `services/stock/reservation.ts`, job TTL; dilarang state machine order (hanya memanggil antarmuka).
- **Test:** konkurensi (N request paralel), kedaluwarsa, idempotensi commit.
- **Review manusia:** **ya, wajib** (konkurensi stok).

### L-06 `getAvailability` dan override HABIS manual (M2 / B)

- **AC:**
  - Given saldo tersedia 0 When getAvailability Then HABIS.
  - Given stok 10 dan toggle manual aktif When getAvailability Then HABIS.
  - Given menu tanpa isian stok When getAvailability Then sesuai keputusan pertanyaan #5 dan tertulis di test.
  - Given customer, halaman, dan kasir When membaca ketersediaan Then semuanya memakai fungsi ini.
- **Batas file:** `services/stock/availability.ts`; dilarang menyalin aturan ke UI.
- **Test:** unit tabel kebenaran; kontrak konsistensi lintas permukaan.
- **Review manusia:** ya.

### L-07 UI isi stok pagi `/logistik` (M2 / B)

- **AC:**
  - Given daftar 10 menu When dibuka Then satu isian angka per menu, keypad numerik, tombol Simpan.
  - Given menekan "Salin stok kemarin" When tersedia data Then semua isian terisi dan bisa diubah.
  - Given simpan gagal When respons error Then isian tidak hilang dan teks error Bagian 8 tampil.
  - Given HP Android lebar 360 px When dibuka Then tanpa scroll horizontal, target ketuk minimal 44 px.
- **Batas file:** `app/logistik/stok-pagi/*`; dilarang `StockService`.
- **Test:** komponen + e2e ringan; cek aksesibilitas label.
- **Review manusia:** tidak.

### L-08 UI lihat sisa + toggle HABIS (M2 / B)

- **AC:**
  - Given order masuk When realtime tiba Then angka tersedia berubah tanpa muat ulang.
  - Given koneksi putus lalu tersambung When pulih Then data disinkronkan dan penanda hilang.
  - Given toggle HABIS ditekan When sukses Then menu HABIS di halaman customer.
- **Batas file:** `app/logistik/sisa/*`.
- **Test:** komponen, simulasi putus-sambung.
- **Review manusia:** tidak.

### L-09 Tampilan HABIS di halaman customer (M2 / A+B)

- **Konteks:** titik temu Stream A dan B; hanya memakai `getAvailability`.
- **AC:**
  - Given dua pelanggan memesan porsi terakhir When bersamaan Then satu berhasil dan menu langsung HABIS bagi yang lain.
  - Given menu HABIS When dipesan lewat permintaan langsung (API) Then server menolak.
- **Batas file:** komponen menu customer (koordinasi Stream A); dilarang logika stok.
- **Test:** integrasi + e2e skrip demo.
- **Review manusia:** ya.

### L-10 Audit log aksi stok (M2 / B)

- **AC:**
  - Given setDailyStock, toggle manual, atau koreksi When dijalankan Then audit log mencatat pelaku, waktu, nilai sebelum/sesudah.
  - Given pengguna biasa When membaca audit log Then ditolak (hanya pemilik/admin).
- **Test:** integrasi.
- **Review manusia:** ya (aksi sensitif).

### L-11 Koreksi stok (M4 / B)

- **AC:**
  - Given koreksi −3 dengan alasan When disimpan Then movement `adjustment` −3 dan audit tercatat.
  - Given koreksi tanpa alasan When disimpan Then ditolak.
  - Given hasil koreksi membuat saldo negatif When disimpan Then ditolak.
  - Given salah koreksi When dibalik Then movement `reversal` baru, baris lama utuh.
- **Batas file:** `services/stock/adjust.ts`, UI koreksi.
- **Test:** unit + RLS role.
- **Review manusia:** ya.

### L-12 Catat terbuang (M4 / B)

- **AC:**
  - Given terbuang 2 porsi, alasan "basi" When disimpan Then movement `waste` −2.
  - Given jumlah melebihi saldo When disimpan Then ditolak dengan pesan jelas.
  - Given role kasir When mencoba Then ditolak.
- **Test:** unit + RLS.
- **Review manusia:** ya.

### L-13 Rekap akhir hari (M4 / B)

- **AC:**
  - Given hari dengan data When rekap dibuka Then tiap menu menampilkan awal, terjual, terbuang, koreksi, sisa; total cocok dengan ledger.
  - Given hari tanpa data When dibuka Then keadaan kosong Bagian 8.
  - Given tanggal 30 hari lalu When dipilih Then data tampil; lebih lama dari itu tidak ditawarkan \[HIPOTESIS\].
- **Aturan:** dihitung dari ledger, tanpa tabel ringkasan ditimpa.
- **Test:** unit rekonsiliasi (jumlah rekap = jumlah movement).
- **Review manusia:** tidak.

### L-14 Test lintas modul stok (M2 dan M4 / B)

- **AC:** suite memuat: oversell paralel, kedaluwarsa TTL, commit ganda, idempotensi movement, RLS lintas outlet, void order mengembalikan stok sesuai aturan state machine.
- **Review manusia:** ya.

### L-15 Kesiapan pilot logistik (M4 / B)

- **AC:**
  - Given seed outlet pilot When UAT dijalankan Then skrip demo bagian stok lolos tanpa bantuan.
  - Given runbook When dibaca Then ada langkah koreksi stok darurat dan rollback migrasi stok.
- **Review manusia:** ya.

## 13. Pemetaan ke G0

| Uji | Task terkait |
| --- | --- |
| T2 A3 (mau isi stok harian) | L-04, L-07 (prototipe T3 memakai layar yang sama) |
| T3 (10 menu dalam 3 menit, tanpa bantuan) | L-07; varian B: "Salin stok kemarin" |
| Gagal T1/T2 | L-03 sampai L-09 ditinjau ulang; L-11 sampai L-13 sebagian tetap berguna \[HIPOTESIS\] |

Kode produk (L-03 dan seterusnya) baru boleh dimulai setelah G0 lolos dan kontrak beku di Fase 4. L-01 dan L-02 adalah bahan desain Fase 4 dan boleh dikerjakan sebelum itu.

🚀 Audit Suka Suka App

Sistem Stock Opname Multi-Cabang cerdas berbasis Google Apps Script. Satu aplikasi web terpusat untuk mengelola audit di banyak cabang secara real-time, tanpa perlu install aplikasi di HP petugas.

🔥 Fitur "Killer"

🏢 Multi-Database Engine: Aplikasi otomatis "lompat" ke Spreadsheet cabang yang berbeda sesuai pilihan user. Data antar cabang tidak akan tertukar.

⚡ Real-time Validation: Scan kode barang -> Sistem langsung validasi ke Master Barang -> Menampilkan Lokasi Rak & Stok Sistem dalam milidetik.

🤖 Auto-Sorting:

Barang Resmi → Masuk tab Data Valid.

Barang Asing/Salah Kode → Masuk tab Data N/A (untuk investigasi).

🛠️ Bulk Actions (Power User): Centang 50 baris sekaligus → Klik Hapus Massal atau Edit Qty Massal. Hemat waktu!

🖨️ Smart Export & Print:

What You See Is What You Get: Hasil print/excel mengikuti filter tanggal/pencarian yang sedang aktif.

Selection Only: Bisa print/export HANYA baris yang dicentang.

📱 Fully Responsive: Sidebar menyusut di Laptop, menu off-canvas di HP, dan tabel yang bisa di-scroll horizontal.

🗄️ Arsitektur Database (Google Sheets)

Sistem ini menggunakan logika 1 Master Config + N Cabang Database.

1. Spreadsheet UTAMA (Config)

File ini menempel dengan Script. Wajib memiliki tab:

Master_User: Manajemen login petugas (Username, Password, Role, Default Cabang).

Master_Config_Cabang: Peta routing cabang (Nama Cabang & ID Spreadsheet tujuannya).

2. Spreadsheet CABANG (Data Toko)

Setiap toko punya file sendiri. Wajib memiliki tab:

Master_Barang: Database stok sistem (Kolom A=Kode, F=Lokasi, I=Stok).

Log_Temuan_Valid: Menyimpan hasil scan barang yang terdaftar.

Log_Temuan_NA: Menyimpan hasil scan barang tak dikenal (Unknown).

🚀 Cara Instalasi Cepat

Persiapan: Siapkan Google Sheets untuk Config dan minimal 1 file untuk Cabang.

Kode: Buka Editor Apps Script, buat file-file berikut dan paste kodenya:

Code.gs & Api.gs (Backend)

Index.html, Login.html, Sidebar.html (UI Structure)

JavaScript.html (Frontend Logic)

CSS.html (Styling)

Deploy:

Klik Deploy > New Deployment.

Type: Web App.

Execute as: Me (Email Pemilik).

Who has access: Anyone (Penting agar bisa akses via HP tanpa login Google).

Selesai: Bagikan link Web App ke tim audit.

💡 Tips Penggunaan

Filter Canggih: Gunakan kombinasi pencarian nama + filter tanggal untuk mengerucutkan laporan sebelum di-print.

Edit Cepat: Salah input jumlah? Tidak perlu hapus. Cukup klik tombol Pensil (Edit) atau gunakan fitur centang massal untuk koreksi banyak item sekaligus.

Dibangun dengan ❤️ untuk efisiensi Audit.

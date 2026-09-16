# 🧪 Panduan Pengujian & Audit Masalah - Tabkeep

Dokumen ini berisi rangkuman celah, skenario kemunculan, cara pengetesan mandiri, serta status perbaikannya untuk persiapan **Festival / Kompetisi**.

---

## 📋 Status Ringkas Perbaikan

| No | Masalah | Status | Keterangan |
|---|---|---|---|
| **1** | Tulisan Tombol Gaib di Mode Terang |  **Sudah Beres** | Diperbaiki di `TabPickerView.tsx` |
| **2** | Backup Offline Lengkap (Folder & Bintang) |  **Sudah Beres** | Tombol `Download JSON` ditambahkan di `SettingsModal.tsx` |
| **3** | Sampah Screenshot Menumpuk di Memori |  **Sudah Beres** | `deleteThumbnails` batch otomatis dipanggil saat hapus permanen & empty trash |
| **4** | Tampilan Awal "Rumah Kosong" | ⏹️ **Di-rollback** | Dipertahankan sesuai desain original |
| **5** | Google Drive Ditolak di Komputer Lain | ℹ️ **Catatan** | Gunakan Backup JSON offline sebagai penyelamat demo |

---

## 🔍 Detail Masalah & Cara Tes Mandiri

### 1. Tulisan Tombol Hilang (Teks Putih di Background Putih)
- **Status**:  **SUDAH DIPERBAIKI**
- **Saat apa kejadiannya?**  
  Saat laptop/browser menggunakan **Mode Terang (Light Mode)**, lalu membuka popup Tabkeep.
- **Cara tes hasil perbaikan:**
  1. Pastikan tampilan browser atau laptop di-set ke tema Terang (Light Mode).
  2. Klik ikon ekstensi **Tabkeep** di pojok kanan atas browser untuk membuka jendela popup.
  3. Perhatikan tombol tengah **"Copy link"**.
  4. **Hasil sekarang**: Tulisannya abu-abu gelap pekat dan terbaca sangat jelas di atas latar abu-abu muda.

---

### 2. Backup File Cuma Simpan Link Doang (Folder & Bintang Hilang)
- **Status**:  **SUDAH DIPERBAIKI**
- **Saat apa kejadiannya?**  
  Saat mencadangkan data secara offline lewat menu Settings di Dashboard.
- **Cara tes hasil perbaikan:**
  1. Buka tab **Dashboard Tabkeep**.
  2. Klik ikon gerigi (**⚙️ Settings**) di pojok kiri bawah.
  3. Scroll ke bagian **Backup / Export**.
  4. Klik tombol **`[ Download JSON ]`**.
  5. Buka file `.json` yang terunduh di Notepad.
  6. **Hasil sekarang**: Isinya sudah memuat struktur folder, nama sesi, bintang, dan pengaturan secara lengkap. File ini bisa langsung di-restore lewat kotak Import di bawahnya.

---

### 3. Sampah Gambar Screenshot Numpuk Terus di Memori Browser
- **Status**:  **SUDAH DIPERBAIKI**
- **Saat apa kejadiannya?**  
  Saat kamu menghapus sesi/tab yang sudah tidak dipakai. Foto tangkapan layar (thumbnail) sebelumnya tetap tersimpan selamanya di memori browser (IndexedDB).
- **Cara tes hasil perbaikan:**
  1. Di tab Dashboard Tabkeep, tekan tombol **F12** di keyboard (untuk membuka *Inspect / Developer Tools*).
  2. Di jendela Inspect bagian atas, klik tab **Application** (jika tertutup, klik tanda panah `>>`).
  3. Di menu sebelah kiri, cari dan klik **IndexedDB** ➡️ klik **TabKeepDB** ➡️ klik **thumbnails**.
  4. Perhatikan daftar thumbnail screenshot yang tersimpan di tabel.
  5. Sekarang di Dashboard Tabkeep, buka menu **Trash**, lalu klik **Delete Forever** pada salah satu sesi atau klik **Empty Trash**.
  6. Balik ke jendela Inspect tadi, klik tombol **Refresh** (ikon panah melingkar) di atas tabel thumbnail.
  7. **Hasil sekarang**: Baris data gambar dari tab yang barusan dihapus permanen **langsung lenyap dari IndexedDB**! Thumbnail otomatis dibersihkan tanpa mengganggu tab lain yang masih aktif.

---

### 4. Tampilan Awal "Rumah Kosong"
- **Status**: ⏹️ **DIBATALKAN / DI-ROLLBACK** (Sesuai preferensi, mempertahankan desain original bawaan)
- **Keterangan:** Tampilan dashboard kosong tetap menggunakan teks panduan original ("Click Tabkeep icon then \"Save to Tabkeep\"") tanpa tombol aksi tambahan.

---

### 5. Google Drive Ditolak di Laptop Lain
- **Status**: ℹ️ **MITIGASI DENGAN BACKUP JSON**
- **Saat apa kejadiannya?**  
  Saat kamu memasang folder ekstensi ini di laptop teman atau laptop juri festival secara *Load unpacked*.
- **Cara tes / melihat penyebabnya:**
  1. Buka `brave://extensions/` di browser.
  2. Cari kotak **Tabkeep**, lalu perhatikan deretan huruf acak pada **ID** (misal: `id: abcdefgh...`).
  3. Google Cloud OAuth saat ini hanya mendaftarkan 1 ID milik perangkat pengembang awal.
  4. Ketika folder dipindahkan ke laptop lain, browser otomatis membuat **ID baru yang berbeda**.
  5. Begitu tombol *Sync to Google Drive* diklik di laptop lain, Google akan menolak dengan pesan error `redirect_uri_mismatch`.
  - **Solusi Aman**: Saat presentasi, gunakan fitur **Download & Import JSON** (Poin 2) yang 100% offline dan anti-gagal.

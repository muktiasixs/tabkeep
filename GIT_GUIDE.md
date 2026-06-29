# 📘 Tabkeep Git Collaboration & Workflow Guide

Panduan ini dibuat untuk menyelaraskan alur kerja (*version control*) tiga developer (**Keanu**, **Ariq**, dan **Muktiasa**) agar proses kolaborasi berjalan rapi, terhindar dari konflik kode (*merge conflict*), dan riwayat commit tetap bersih.

---

## 📌 1. Strategi Branching (Percabangan)

Untuk tim kecil berisi 3 orang, kita menggunakan model **Feature Branching / Developer Branching**:
* **`main`**: Branch utama yang selalu stabil dan berisi kode siap pakai (*production-ready*). Jangan menulis kode langsung di branch `main` saat bekerja!
* **Branch Kerja**:
  * **`ariq`**: Branch kerja khusus Ariq.
  * **`keanu`** (atau nama kerja kamu): Branch kerja khusus Keanu.
  * **`muktiasa`**: Branch kerja khusus Muktiasa.
  * *Alternatif (Feature Branch)*: Jika sedang mengerjakan fitur besar, buat branch spesifik dari main, misalnya `feat/analytics` atau `fix/popup-bug`.

---

## 🔄 2. Alur Kerja Harian (Daily Push & Pull Flow)

Setiap kali ingin mulai bekerja atau mengirimkan update, ikuti alur standar 5 langkah berikut:

### Langkah A: Mulai Hari Kerja (Ambil Kode Terbaru)
Sebelum mulai menulis kode baru, selalu ambil update terbaru dari branch `main` agar kode di komputermu tidak tertinggal.
```bash
# 1. Pindah ke branch utama
git checkout main

# 2. Tarik kode terbaru dari GitHub ke komputer lokal
git pull origin main

# 3. Kembali ke branch kerja kamu (misal: ariq)
git checkout ariq

# 4. Gabungkan update dari main tadi ke branch kerjamu agar sinkron
git merge main
```

### Langkah B: Menulis Kode & Commit Lokal
Tulis kode di branch kerja masing-masing. Jika fitur sudah berjalan baik:
```bash
# 1. Cek file apa saja yang berubah
git status

# 2. Masukkan file yang diubah ke persiapan commit
git add .

# 3. Buat commit dengan pesan yang jelas (Gunakan prefiks feat/fix/refactor)
git commit -m "feat: tambahkan fitur light mode toggle"
```

### Langkah C: Push ke GitHub (Mengirim Pekerjaan)
Kirim perubahan dari branch kerjamu ke GitHub:
```bash
git push origin <nama-branch-kamu>
# Contoh: git push origin ariq
```

---

## 🔀 3. Cara Menggabungkan Kode ke `main` (Merge Flow)

Setelah fitur di branch kerja selesai dan dites, gabungkan ke `main` dengan salah satu cara berikut:

### Cara A: Melalui Pull Request (PR) di GitHub (Sangat Direkomendasikan ⭐)
Ini adalah cara teraman untuk kolaborasi tim karena anggota tim lain bisa meninjau (*code review*) sebelum digabungkan.
1. Buka repository **Tabkeep** di GitHub.
2. Klik tombol **Compare & pull request** untuk branch yang baru saja di-push.
3. Beri deskripsi singkat apa yang diubah.
4. Klik **Create pull request**.
5. Anggota tim lain melakukan review, lalu klik **Merge pull request**.

### Cara B: Merge Lokal (Jika ingin cepat dan sudah disepakati bersama)
```bash
# 1. Pindah ke main
git checkout main

# 2. Ambil update main terbaru dari github (jika ada rekan lain yang baru saja push)
git pull origin main

# 3. Gabungkan branch kerja kamu ke main
git merge ariq

# 4. Kirim hasil penggabungan ke main di GitHub
git push origin main

# 5. Kembali ke branch kerja kamu untuk lanjut bekerja
git checkout ariq
```

---

## ⚡ 4. Cara Mengatasi Konflik Kode (Conflict Resolution)

Konflik (*merge conflict*) terjadi jika dua orang mengedit **baris file yang sama** secara bersamaan. Jangan panik, berikut cara menyelesaikannya secara aman:

### Cara Menyelesaikan Konflik:
1. Jika saat melakukan `git merge` muncul tulisan `CONFLICT (content): Merge conflict in...`, buka editor (VS Code).
2. VS Code akan menandai area yang konflik dengan warna merah/biru:
   * **Accept Current Change**: Mempertahankan kode kamu yang sekarang.
   * **Accept Incoming Change**: Menggunakan kode dari rekan kamu yang baru ditarik.
   * **Accept Both Changes**: Mempertahankan kedua kode tersebut.
3. Edit file tersebut secara manual hingga rapi dan hapus simbol pemisah konflik (`<<<<<<<`, `=======`, `>>>>>>>`).
4. Setelah rapi, simpan file dan jalankan perintah:
   ```bash
   git add .
   git commit -m "fix: selesaikan konflik merge dengan main"
   git push origin <nama-branch-kamu>
   ```

---

## 💡 5. Aturan Emas Kolaborasi Git (Golden Rules)
1. **Jangan pernah push langsung ke `main` tanpa konfirmasi/test terlebih dahulu.**
2. **Commit sering-sering dengan pesan yang jelas.** Hindari commit besar sekaligus. Contoh pesan commit yang baik:
   * `feat: ...` (fitur baru)
   * `fix: ...` (memperbaiki bug)
   * `style: ...` (merapikan tampilan/css)
3. **Selalu lakukan `git pull` sebelum mulai menulis kode** agar konflik bisa dihindari sejak awal.

---

## ⚠️ 6. Risiko Bug Teknis & Solusi Otomatisasi (Bugs Risk & Solutions)

Untuk mencegah terjadinya bug komunikasi dan fungsionalitas di masa mendatang, seluruh developer wajib mengetahui risiko teknis berikut yang sudah diatasi dengan sistem otomatisasi:

### A. UI Menggantung (Infinite Messaging Hang)
* **Risiko**: Menggunakan `chrome.runtime.sendMessage` tanpa batas waktu tunggu (*timeout*) akan membuat UI ekstensi *stuck* loading selamanya jika background script tidak aktif.
* **Solusi**: Semua pemanggilan pesan di [popup.tsx](file:///d:/tabkeep_keanu/popup.tsx) dan [TabPickerView.tsx](file:///d:/tabkeep_keanu/components/TabPickerView.tsx) dibungkus menggunakan wrapper Promise dengan **timeout fallback 500ms**.

### B. Koneksi Invalidated Pasca Reload Ekstensi
* **Risiko**: Saat ekstensi di-reload (karena modifikasi kode), halaman dashboard aktif kehilangan koneksi dengan background script, memicu error *“Extension context invalidated”*.
* **Solusi**: Memasang *heartbeat check* berkala setiap **1500ms** di [dashboard.tsx](file:///d:/tabkeep_keanu/tabs/dashboard.tsx) yang secara otomatis akan **me-refresh halaman** jika mendeteksi koneksi terputus.

### C. Penolakan Izin Membaca Clipboard
* **Risiko**: Mengakses `navigator.clipboard.readText()` tanpa izin resmi dari manifest akan diblokir oleh Chrome.
* **Solusi**: Pastikan izin `"clipboardRead"` terdaftar dalam array `permissions` di [package.json](file:///d:/tabkeep_keanu/package.json).

### D. Konflik Seleksi Teks & Navigasi Saat Shift-Click
* **Risiko**: Menahan tombol Shift saat menyeleksi list tab memicu highlight teks liar browser atau double-trigger event klik.
* **Solusi**: Menerapkan kelas CSS `select-none` pada daftar tab, menonaktifkan pointer events pada checkbox asli (`pointer-events-none`), dan membatasi deteksi klik pada tag `<a>`.


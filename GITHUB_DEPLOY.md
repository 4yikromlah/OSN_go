# Panduan Lengkap Deploy Aplikasi CBT OSN dari GitHub ke Google Cloud Run

Dokumen ini menjelaskan langkah-langkah praktis untuk mengunggah aplikasi CBT OSN ini ke akun **GitHub** Anda dan mengaktifkan **CI/CD Deployment otomatis** ke **Google Cloud Run** menggunakan file `.github/workflows/deploy-cloudrun.yml` yang sudah dikonfigurasi.

---

## 📌 Prasyarat & Persiapan Awal
Sebelum memulai, pastikan Anda telah memiliki:
1. Akun **GitHub** ([github.com](https://github.com)).
2. Akun **Google Cloud Platform (GCP)** dengan proyek aktif ([console.cloud.google.com](https://console.cloud.google.com)).
3. Akun **Supabase** dengan tabel CBT yang sudah di-bootstrap.

---

## 📁 File Deployment yang Tersedia dalam Repositori Ini

1. **`Dockerfile`**: Menggunakan *multi-stage production-build* yang ringan berbasis `node:20-alpine`. Berfungsi untuk mengompilasi Vite frontend & Express backend, kemudian membundelnya menjadi satu container siap jalan.
2. **`.github/workflows/deploy-cloudrun.yml`**: Pipelin otomatis (*Workflow*) di GitHub Actions untuk menguji kode, melintasi (lint), melakukan kompilasi build, membuat image Docker, menyimpannya di Google Artifact Registry, dan melakukan deploy ulang langsung ke Google Cloud Run setiap kali Anda melakukan `push` ke branch utama (`main` / `master`).

---

## 🚀 Langkah 1: Push Repositori Lokal ke GitHub

Jika Anda belum memasukkan kode ini ke repositori GitHub pribadi:

1. Buka terminal di folder root project ini.
2. Inisialisasi git dan buat commit baru:
   ```bash
   git init
   git add .
   git commit -m "feat: inisialisasi aplikasi CBT OSN dengan opsi jumlah soal baru dan dockerfile"
   ```
3. Buat Repositori kosong di GitHub (beri nama bebas, misal `cbt-osn`).
4. Hubungkan repositori lokal Anda ke remote GitHub lalu push kodenya:
   ```bash
   git branch -M main
   # Ganti URL di bawah ini dengan URL repositori Anda sendiri
   git remote add origin https://github.com/USERNAME_ANDA/REPOSITORI_ANDA.git
   git push -u origin main
   ```

---

## 🔑 Langkah 2: Setup Service Account & Kredensial di Google Cloud (GCP)

Agar GitHub Actions memiliki izin untuk melakukan build dan memperbarui servis di Google Cloud Run:

1. **Aktifkan API Google Cloud**:
   Buka Google Cloud Console Cloud Shell / Terminal lokal Anda dan aktifkan layanan berikut:
   ```bash
   gcloud services enable artifactregistry.googleapis.com \
                          run.googleapis.com \
                          cloudbuild.googleapis.com \
                          iam.googleapis.com
   ```

2. **Buat Repositori Docker di Artifact Registry**:
   Buat repositori Docker baru dengan mencocokkan region pada file Workflow:
   ```bash
   gcloud artifacts repositories create cbt-osn \
       --repository-format=docker \
       --location=asia-east1 \
       --description="Repositori Docker Image CBT OSN"
   ```

3. **Buat Service Account untuk GitHub**:
   ```bash
   gcloud iam service-accounts create github-deploy-sa \
       --display-name="GitHub Deploy Service Account"
   ```

4. **Berikan Hak Akses (Roles) ke Service Account**:
   Hubungkan Service Account yang baru dibuat dengan peran agar dapat mengunggah file docker dan mengontrol Cloud Run:
   ```bash
   # Berikan hak akses Admin Artifact Registry
   gcloud projects add-iam-policy-binding [ID-PROYEK-GCP-ANDA] \
       --member="serviceAccount:github-deploy-sa@[ID-PROYEK-GCP-ANDA].iam.gserviceaccount.com" \
       --role="roles/artifactregistry.writer"

   # Berikan hak akses Admin Cloud Run
   gcloud projects add-iam-policy-binding [ID-PROYEK-GCP-ANDA] \
       --member="serviceAccount:github-deploy-sa@[ID-PROYEK-GCP-ANDA].iam.gserviceaccount.com" \
       --role="roles/run.admin"

   # Berikan hak akses sebagai Service Account User (untuk menjalankan instance run)
   gcloud projects add-iam-policy-binding [ID-PROYEK-GCP-ANDA] \
       --member="serviceAccount:github-deploy-sa@[ID-PROYEK-GCP-ANDA].iam.gserviceaccount.com" \
       --role="roles/iam.serviceAccountUser"
   ```

5. **Generate Kunci JSON Kredensial (SA Key)**:
   ```bash
   gcloud iam service-accounts keys create gcp-key.json \
       --iam-account="github-deploy-sa@[ID-PROYEK-GCP-ANDA].iam.gserviceaccount.com"
   ```
   *Salin isi dari berkas `gcp-key.json` ini untuk dimasukkan ke GitHub Secrets.*

---

## 🔒 Langkah 3: Tambahkan Secrets di GitHub

Buka repositori GitHub Anda di browser, masuk ke menu **Settings** > **Secrets and variables** > **Actions** > **Repository secrets**, lalu tambahkan variabel rahasia berikut:

| Nama Secret | Nilai /Isi | Penjelasan |
| :--- | :--- | :--- |
| `GCP_PROJECT_ID` | `ID Proyek GCP Anda` | ID Unik konsol Google Cloud Anda |
| `GCP_SA_KEY` | *(Salin seluruh teks JSON di dalam berkas `gcp-key.json`)* | Kunci otentikasi aman akun layanan GCP Anda |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Endpoint URL Supabase Anda |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1Ni...` | Kunci Publik Anonim dari dasbor Supabase |
| `GEMINI_API_KEY` | `AIzaSy...` | Kunci API Gemini Anda dari AI Studio (Opsional / diperlukan jika menggunakan fitur AI) |

---

## 🏁 Langkah 4: Jalankan Deployment Pertamanya!

Sekarang setiap kali Anda melakukan komit baru (`push`) pada branch utama Anda, silakan buka tab **Actions** di repositori GitHub Anda. Anda akan melihat alur kerja **Build & Deploy to Google Cloud Run** sedang otomatis memvalidasi, melinting kode, membungkusnya ke dalam Docker container, dan melakukan rilis baru langsung ke internet!

### 💡 Penanganan Error / Troubleshooting Mandiri
- **Error "Supabase URL tidak valid" saat inisialisasi awal**: Kami telah menerapkan *safe-handling proxy fallback* pada `src/lib/supabaseClient.ts`, sehingga jika nilai Server / Docker tidak diisi saat startup awal, aplikasi tidak akan crash lagi dengan kesalahan "invalid argument", melainkan berjalan secara aman dan melayani status koneksi terputus dengan anggun.
- **Masalah Port 3000**: Dockerfile ini secara spesifik mengekspos dan memetakan aplikasi Express ke Port `3000`. Cloud Run secara otomatis akan memetakan lalu lintas browser HTTPS Anda melalui proxy reverse ke container ini tanpa hambatan ekstra.

Selamat bereksperimen! Aplikasi Anda kini memiliki standar CI/CD modern profesional!

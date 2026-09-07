# MASTER TECHNICAL SPECIFICATION & BUILD INSTRUCTIONS
## Website AILO (AI Learning For Optimization) — Telkom University

**Versi:** 1.0
**Tanggal:** 7 September 2026
**Untuk:** Tim Developer Internal
**Status:** Draft untuk Development

---

## DAFTAR ISI

1. Executive Summary
2. Tujuan & Ruang Lingkup
3. Tech Stack & Arsitektur
4. Struktur Navigasi & Halaman
5. Modul Fitur (Detail Spesifikasi)
6. Skema Database (MongoDB)
7. Struktur API Routes
8. Environment Variables & Secrets
9. Struktur Folder Project
10. Alur Kerja (User Flow) Kunci
11. Keamanan & Best Practice
12. Build & Deployment — Step by Step
13. Setup Layanan Pihak Ketiga (Groq, Gmail, MongoDB Atlas, Scopus)
14. Testing Checklist
15. Roadmap Pengembangan (Fase)

---

## 1. EXECUTIVE SUMMARY

Website AILO adalah platform digital untuk lab riset **AI Learning For Optimization** di bawah Telkom University. Website ini berfungsi sebagai:

- Portal informasi riset, proyek, tim, dan lab
- Media publikasi berita yang dibantu generate oleh AI (Groq API)
- Chatbot interaktif berbasis RAG untuk menjawab pertanyaan pengunjung seputar AILO
- Sistem manajemen konten (site settings) tanpa perlu edit kode
- Sistem peminjaman lab dan perangkat riset
- Direktori dosen/peneliti dengan integrasi data publikasi Scopus
- Dibangun dengan aksesibilitas (Text-to-Speech) untuk inklusivitas pengguna

Dokumen ini adalah **spesifikasi teknis tunggal (single source of truth)** yang menjadi acuan tim developer dalam membangun, mengembangkan, dan men-deploy sistem.

---

## 2. TUJUAN & RUANG LINGKUP

### 2.1 Tujuan
- Menyediakan wadah digital resmi AILO yang informatif, modern, dan mudah dikelola non-teknis (admin).
- Mengotomatisasi proses penulisan berita menggunakan AI generatif.
- Memberikan akses interaktif via AI Chatbot bagi pengunjung.
- Mendigitalisasi proses peminjaman lab/perangkat agar terstruktur dan terlacak.
- Menampilkan kredibilitas riset melalui data publikasi Scopus dosen/peneliti.

### 2.2 Target Pengguna
| Role | Deskripsi Akses |
|---|---|
| **Super Admin** | Akses penuh: site settings, user management, semua modul |
| **Admin/Editor** | Kelola berita, riset, proyek, tim, lab, perangkat |
| **Staff Lab** | Approve/reject booking lab & perangkat |
| **Pengunjung (Publik)** | Lihat konten, gunakan chatbot, ajukan booking (jika diizinkan) |

### 2.3 Di Luar Ruang Lingkup (Out of Scope) — v1.0
- Tidak ada login untuk pengunjung publik (booking bisa dilakukan dengan form + verifikasi email, tanpa akun).
- Tidak ada payment/pembayaran (peminjaman lab bersifat gratis/internal).
- Scraping data Scopus tanpa API resmi (akan menggunakan Scopus API/Elsevier).

---

## 3. TECH STACK & ARSITEKTUR

### 3.1 Stack Utama

| Layer | Teknologi | Keterangan |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | Full-stack: frontend + API routes |
| Bahasa | **TypeScript** | Type-safety wajib di seluruh project |
| Styling | **Tailwind CSS + shadcn/ui** | Konsisten, cepat, mudah di-maintain |
| Database | **MongoDB Atlas** | Via connection string (URL) yang sudah disediakan |
| ODM | **Mongoose** | Schema validation & modeling |
| Auth (Admin) | **NextAuth.js (Credentials Provider) + JWT** | Login admin pakai email+password tersimpan di MongoDB (bcrypt hash) |
| AI - Chatbot & News Gen | **Groq API** (model Llama 3.x / sesuai ketersediaan) | Untuk RAG chatbot & generate narasi berita |
| Vector Store (RAG) | **MongoDB Atlas Vector Search** | Menyimpan embedding konten web untuk retrieval chatbot |
| Embedding Model | Groq (jika tersedia) atau fallback ke model open-source (e.g. `all-MiniLM` via API terpisah) | Perlu diverifikasi ketersediaan model embedding di Groq saat implementasi |
| Mailer | **Nodemailer + Gmail App Password (SMTP)** | Notifikasi booking, kontak form |
| Image Storage | **Cloudinary** (direkomendasikan) atau disk lokal server + Nginx static serving | Untuk gambar berita & aset lain |
| Text-to-Speech (Aksesibilitas) | **Web Speech API (browser native)** sebagai default; opsional upgrade ke **ElevenLabs/Google TTS API** | Browser native = gratis, tanpa API key |
| Hosting/Deploy | **Biznet Gio Cloud (VPS/Cloud Server)** | Self-managed server: Nginx + PM2 + Docker (opsional) |
| Scopus Data | **Scopus API (Elsevier)** via `Author Retrieval API` | Perlu API Key dari Elsevier Developer Portal |

### 3.2 Arsitektur Tingkat Tinggi

```
┌──────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                  │
│   Next.js Pages (SSR/SSG) + React Components          │
│   - Floating AI Chatbot Widget                         │
│   - TTS Accessibility Button                            │
└───────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│         NGINX (Reverse Proxy + SSL/Certbot)            │
└───────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│      NEXT.JS APP — dijalankan via PM2 (Node.js)        │
│           (Biznet Gio Cloud Server / VPS)               │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────┐  │
│  │ App Router  │  │ API Routes  │  │ Middleware       │  │
│  │ Pages       │  │ (/api/*)    │  │ (Auth Guard)     │  │
│  └────────────┘  └─────┬──────┘  └─────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ node-cron (in-process job) → Scopus sync mingguan │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┬───────────────┐
        ▼                 ▼                 ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌─────────────┐
│ MongoDB Atlas │ │   Groq API     │ │ Gmail SMTP     │ │ Scopus API   │
│ (Data+Vector) │ │ (Chat & News)  │ │ (Nodemailer)   │ │ (Elsevier)   │
└───────────────┘ └───────────────┘ └───────────────┘ └─────────────┘
```

### 3.3 Prinsip Arsitektur
- **Config-driven, bukan hardcode**: semua teks, warna tema, kontak, logo dikelola lewat koleksi `SiteSettings` di database.
- **Modular**: tiap fitur (news, booking, scopus, chatbot) berdiri sebagai modul terpisah (folder tersendiri) agar mudah dikembangkan/dinonaktifkan.
- **API-first**: semua data dari MongoDB diakses lewat API routes internal (`/api/**`), tidak ada akses DB langsung dari client.
- **Role-based access control (RBAC)** di level middleware & API.

---

## 4. STRUKTUR NAVIGASI & HALAMAN

Berdasarkan referensi navbar AILO saat ini (Research, Projects, Team, About, Labs, News), berikut struktur halaman lengkap yang direkomendasikan:

### 4.1 Halaman Publik

| Halaman | Route | Deskripsi |
|---|---|---|
| Home | `/` | Hero section, highlight riset, berita terbaru, CTA |
| Research | `/research` | Daftar topik/area riset AILO |
| Research Detail | `/research/[slug]` | Detail satu topik riset |
| Projects | `/projects` | Daftar proyek (riset/kolaborasi/produk) |
| Project Detail | `/projects/[slug]` | Detail proyek: deskripsi, tim, status, output |
| Team | `/team` | Daftar anggota (dosen, peneliti, mahasiswa) |
| Team Detail | `/team/[slug]` | Profil individu + **data Scopus** (jika dosen) |
| Labs | `/labs` | Daftar lab yang dimiliki AILO |
| Lab Detail | `/labs/[slug]` | Detail lab: fasilitas, perangkat, **tombol ajukan peminjaman** |
| Booking Perangkat | `/labs/[slug]/booking` | Form pengajuan peminjaman lab/perangkat |
| News | `/news` | Daftar berita (AI-generated), dengan filter/kategori |
| News Detail | `/news/[slug]` | Detail berita lengkap |
| About | `/about` | Profil AILO, visi-misi, sejarah |
| Contact | `/contact` | Form kontak (kirim via mailer) |

### 4.2 Halaman Admin (Protected — butuh login)

| Halaman | Route | Deskripsi |
|---|---|---|
| Login | `/admin/login` | Form login admin |
| Dashboard | `/admin/dashboard` | Ringkasan statistik (jumlah berita, booking pending, dll) |
| Kelola Berita | `/admin/news` | List, buat baru (form 5W+1H → generate AI), edit, hapus |
| Kelola Riset | `/admin/research` | CRUD topik riset |
| Kelola Proyek | `/admin/projects` | CRUD proyek |
| Kelola Tim | `/admin/team` | CRUD anggota, termasuk input Scopus Author ID |
| Kelola Lab | `/admin/labs` | CRUD data lab |
| Kelola Perangkat | `/admin/labs/devices` | CRUD perangkat per lab, atur status |
| Kelola Booking | `/admin/bookings` | List pengajuan, approve/reject, kalender |
| Site Settings | `/admin/settings` | Ubah logo, warna, kontak, social media, footer, dll |
| User Management | `/admin/users` | CRUD akun admin/staff + role |
| Chatbot Knowledge | `/admin/chatbot` | Trigger re-index konten web untuk RAG |

### 4.3 Estimasi Total Halaman
**~24 route** (13 publik + 11 admin) — cukup komprehensif namun tetap terstruktur modular agar tidak membebani development di fase awal.

---

## 5. MODUL FITUR (DETAIL SPESIFIKASI)

### 5.1 AI Chatbot (Floating Popup, RAG-based)

**Perilaku UI:**
- Icon chatbot mengambang (floating action button) di pojok kanan bawah, muncul di semua halaman publik.
- Saat diklik → muncul popup/modal chat window (bukan pindah halaman).
- Ada indikator "AI sedang mengetik" (typing indicator) untuk UX yang baik.
- Riwayat chat tersimpan sementara di session (tidak perlu persist ke DB di v1, kecuali untuk analytics).

**Cara Kerja (RAG Flow):**
1. Seluruh konten halaman publik (About, Research, Projects, Team, Labs, News) di-**index** menjadi chunk teks.
2. Setiap chunk diubah jadi **vector embedding** dan disimpan di MongoDB Atlas Vector Search.
3. Saat pengguna bertanya → pertanyaan diubah jadi embedding → dicari chunk paling relevan (similarity search).
4. Chunk relevan + pertanyaan pengguna dikirim sebagai context ke **Groq API** (system prompt: "jawab hanya berdasarkan konteks yang diberikan").
5. Jawaban dikembalikan dan ditampilkan di popup.

**Re-indexing:**
- Otomatis setiap kali ada perubahan konten (create/update/delete pada Research, Projects, Team, Labs, News).
- Tombol manual "Re-index Sekarang" di `/admin/chatbot` untuk jaga-jaga.

**Rekomendasi Guardrail:**
- Jika pertanyaan di luar konteks AILO → chatbot menjawab "Maaf, saya hanya bisa menjawab seputar AILO" (dikontrol via system prompt).
- Rate limiting per IP untuk mencegah abuse (misal 20 pertanyaan/jam).

---

### 5.2 Portal Berita AI-Generated

**Alur Admin:**
1. Admin buka `/admin/news/new`.
2. Admin isi form **5W+1H**:
   - What (apa yang terjadi)
   - Who (siapa yang terlibat)
   - When (kapan)
   - Where (di mana)
   - Why (mengapa)
   - How (bagaimana)
3. Admin upload atau pilih 1-2 gambar (atau opsional: generate placeholder/AI image jika ada budget lanjutan — v1 pakai upload manual dulu).
4. Admin klik **"Generate dengan AI"**.
5. Sistem kirim data 5W+1H ke **Groq API** dengan prompt terstruktur untuk menghasilkan:
   - Judul berita
   - Narasi lengkap (beberapa paragraf, gaya jurnalistik)
   - Ringkasan singkat (untuk preview/meta description)
6. Hasil generate ditampilkan di editor (rich text) → **admin bisa edit manual** sebelum publish (human-in-the-loop, wajib ada untuk quality control).
7. Admin klik **Publish** → berita tayang di `/news`.

**Field Data Berita:**
- Judul, slug, ringkasan, konten (rich text/HTML), gambar (1-2), kategori/tag, status (draft/published), tanggal publish, penulis (admin yang input), data 5W+1H asli (disimpan untuk audit/regenerate).

**Fitur Tambahan:**
- Tombol "Regenerate" jika admin kurang puas dengan hasil AI.
- Riwayat versi (opsional v2).

---

### 5.3 Site Settings (No-Code Configuration)

Semua hal berikut dikelola lewat 1 koleksi `SiteSettings` di database, diakses lewat `/admin/settings`:

| Kategori | Field yang Bisa Diubah |
|---|---|
| Branding | Logo, favicon, nama situs, tagline |
| Tema | Warna primer/sekunder, font (pilihan terbatas) |
| Kontak | Email, telepon, alamat, jam operasional |
| Social Media | Link Instagram, LinkedIn, YouTube, dll |
| Footer | Teks copyright, link cepat |
| Homepage | Teks hero, CTA button, section yang ditampilkan/disembunyikan |
| SEO | Meta title default, meta description default, OG image |
| Chatbot | Aktif/nonaktif, pesan sambutan, warna widget |
| Fitur Toggle | Aktif/nonaktif modul: Booking, News AI, TTS, dll |

**Prinsip teknis:** semua komponen frontend membaca settings ini via API/context provider (`useSiteSettings()` hook), bukan nilai hardcode di komponen.

---

### 5.4 Integrasi Scopus (Data Publikasi Dosen)

**Rekomendasi pendekatan: Hybrid (Manual Input + Auto-Fetch)**

1. Admin input data dosen di `/admin/team`, termasuk field **Scopus Author ID**.
2. Sistem melakukan fetch berkala (cron job / on-demand refresh) ke **Scopus Author Retrieval API** menggunakan Author ID tersebut.
3. Data yang diambil: jumlah dokumen (h-index, citation count), daftar publikasi terbaru (judul, tahun, jurnal, link DOI).
4. Data disimpan cache di MongoDB (field `scopusData` di koleksi Team) agar tidak perlu fetch live setiap kali halaman diakses (Scopus API punya rate limit).
5. Refresh otomatis (misal 1x/minggu) via **node-cron** (dijalankan in-process oleh PM2) atau **crontab Linux** di server Biznet Gio Cloud.
6. Ditampilkan di halaman `/team/[slug]` dalam bentuk kartu publikasi + metrik.

**Catatan:** Akses Scopus API memerlukan API Key dari [Elsevier Developer Portal](https://dev.elsevier.com/), dan biasanya institusi (Telkom University) sudah punya akses langganan Scopus — perlu koordinasi dengan pihak perpustakaan/LPPM kampus untuk API key resmi.

---

### 5.5 User Management

- CRUD akun admin dengan role: **Super Admin**, **Admin/Editor**, **Staff Lab**.
- Password di-hash dengan **bcrypt**, tidak pernah disimpan plain text.
- Reset password via email (menggunakan mailer Gmail App Password).
- Log aktivitas dasar (siapa mengubah apa, kapan) — opsional tapi direkomendasikan untuk akuntabilitas.

---

### 5.6 About Us

Halaman statis namun kontennya dikelola lewat Site Settings/CMS, bukan hardcode:
- Sejarah AILO
- Visi & Misi
- Struktur organisasi (bisa tarik data dari koleksi Team)
- Afiliasi dengan Telkom University

---

### 5.7 Modul Peminjaman Lab & Perangkat

**Data Master:**
- **Lab**: nama, lokasi, kapasitas, deskripsi, foto, daftar perangkat di dalamnya.
- **Perangkat**: nama, spesifikasi, foto, status (`available`, `booked`, `maintenance`), milik lab mana.

**Alur Peminjaman (Booking Flow):**
1. Pengunjung/mahasiswa buka halaman lab → klik **"Ajukan Peminjaman"**.
2. Isi form: nama peminjam, email, no. HP, institusi/unit, tanggal & waktu penggunaan, keperluan, pilih lab dan/atau perangkat spesifik.
3. Sistem cek ketersediaan (tidak bentrok dengan booking lain yang sudah approved di waktu yang sama).
4. Submit → status booking = `pending`.
5. **Email otomatis** terkirim ke admin/staff lab (notifikasi ada pengajuan baru) dan ke peminjam (konfirmasi pengajuan diterima).
6. Admin buka `/admin/bookings`, lihat detail, **approve** atau **reject** (dengan catatan alasan jika reject).
7. **Email otomatis** terkirim ke peminjam sesuai keputusan (approved/rejected).
8. Jika approved → status perangkat/lab otomatis berubah jadi `booked` pada rentang waktu tersebut; admin bisa update jadi `available` kembali setelah selesai (manual atau otomatis berdasarkan waktu selesai).

**Tampilan Admin:**
- List booking dengan filter status (pending/approved/rejected/completed).
- Kalender view (opsional v2) untuk lihat jadwal per lab.

**Validasi Penting:**
- Cegah double-booking pada slot waktu yang sama untuk perangkat/lab yang sama.
- Batas waktu minimal pengajuan (misal H-1) — dikonfigurasi lewat Site Settings.

---

### 5.8 Aksesibilitas (Text-to-Speech)

- Tombol/icon TTS di setiap halaman artikel (News, Research, Project detail) untuk membacakan konten.
- **v1 (gratis, cepat):** menggunakan **Web Speech API** bawaan browser (`speechSynthesis`), tanpa biaya API tambahan, namun kualitas suara tergantung browser/OS pengguna.
- **v2 (opsional, kualitas lebih baik):** integrasi API TTS eksternal (ElevenLabs / Google Cloud TTS) jika ada budget, dengan suara Bahasa Indonesia yang lebih natural.
- Kontrol tambahan yang direkomendasikan: play/pause, kecepatan bicara, ukuran font (accessibility toolbar).

---

## 6. SKEMA DATABASE (MongoDB — Mongoose Schema)

```
User {
  _id, name, email (unique), passwordHash,
  role: enum['super_admin','admin','staff_lab'],
  isActive: boolean,
  createdAt, updatedAt
}

SiteSettings {
  _id, key: 'global' (singleton document),
  branding: { logo, favicon, siteName, tagline },
  theme: { primaryColor, secondaryColor, font },
  contact: { email, phone, address, officeHours },
  socialMedia: { instagram, linkedin, youtube, twitter },
  footer: { copyrightText, quickLinks: [] },
  homepage: { heroTitle, heroSubtitle, ctaText, ctaLink, visibleSections: [] },
  seo: { defaultMetaTitle, defaultMetaDescription, ogImage },
  chatbot: { isEnabled, welcomeMessage, widgetColor },
  featureToggles: { booking: bool, newsAI: bool, tts: bool },
  updatedAt, updatedBy (ref User)
}

News {
  _id, title, slug (unique), summary, content (HTML),
  images: [String] (max 2),
  category, tags: [String],
  status: enum['draft','published'],
  publishedAt,
  author (ref User),
  source5W1H: { what, who, when, where, why, how },
  createdAt, updatedAt
}

Research {
  _id, title, slug, description, content, image,
  relatedTeamMembers: [ref Team],
  status: enum['draft','published'],
  createdAt, updatedAt
}

Project {
  _id, title, slug, description, content, images: [String],
  status: enum['ongoing','completed','planned'],
  teamMembers: [ref Team],
  startDate, endDate,
  createdAt, updatedAt
}

Team {
  _id, name, slug, photo, position (e.g. "Dosen", "Peneliti", "Mahasiswa"),
  bio, email,
  scopusAuthorId: String (optional),
  scopusData: {
    hIndex, citationCount, documentCount,
    publications: [{ title, year, journal, doi, link }],
    lastFetchedAt
  },
  isActive: boolean,
  createdAt, updatedAt
}

Lab {
  _id, name, slug, location, capacity, description, photos: [String],
  devices: [ref Device],
  isActive: boolean,
  createdAt, updatedAt
}

Device {
  _id, name, specification, photo,
  lab (ref Lab),
  status: enum['available','booked','maintenance'],
  createdAt, updatedAt
}

Booking {
  _id, borrowerName, borrowerEmail, borrowerPhone, institution,
  lab (ref Lab), device (ref Device, optional),
  purpose, startDateTime, endDateTime,
  status: enum['pending','approved','rejected','completed','cancelled'],
  reviewedBy (ref User), reviewNote,
  createdAt, updatedAt
}

ChatEmbedding {
  _id, sourceType: enum['news','research','project','team','lab','about'],
  sourceId (ref dinamis), chunkText, embedding: [Number],
  createdAt, updatedAt
}

ContactMessage {
  _id, name, email, subject, message,
  isRead: boolean,
  createdAt
}
```

**Catatan indexing penting:**
- `slug` di semua koleksi konten: unique index.
- `ChatEmbedding.embedding`: gunakan **MongoDB Atlas Vector Search Index**.
- `Booking`: compound index pada `(lab, device, startDateTime, endDateTime)` untuk cek bentrok jadwal secara efisien.

---

## 7. STRUKTUR API ROUTES

```
/api/auth/[...nextauth]        → NextAuth handler (login admin)
/api/auth/reset-password       → POST, kirim email reset password

/api/chatbot/ask               → POST, terima pertanyaan → RAG → Groq → jawaban
/api/chatbot/reindex           → POST (admin only), trigger re-index konten

/api/news                      → GET (list), POST (create, admin)
/api/news/[slug]                → GET, PUT, DELETE (admin)
/api/news/generate              → POST (admin), kirim 5W+1H → Groq → hasil draft

/api/research                   → GET, POST
/api/research/[slug]            → GET, PUT, DELETE

/api/projects                   → GET, POST
/api/projects/[slug]            → GET, PUT, DELETE

/api/team                       → GET, POST
/api/team/[slug]                → GET, PUT, DELETE
/api/team/[slug]/scopus-refresh → POST (admin), fetch ulang data Scopus

/api/labs                       → GET, POST
/api/labs/[slug]                → GET, PUT, DELETE
/api/labs/[slug]/devices        → GET, POST

/api/bookings                   → GET (admin, list all), POST (public, ajukan)
/api/bookings/[id]              → GET, PATCH (approve/reject, admin)

/api/settings                   → GET (public, subset), PUT (admin, full)

/api/users                      → GET, POST (admin only)
/api/users/[id]                 → PUT, DELETE (admin only)

/api/contact                    → POST (public, kirim pesan + email notifikasi)

/api/cron/scopus-sync           → GET (dipanggil crontab Linux/node-cron), refresh semua data Scopus terjadwal
```

**Middleware Proteksi:**
- Semua route `/api/**` kecuali yang ditandai *public* wajib melewati `middleware.ts` yang cek session JWT + role.

---

## 8. ENVIRONMENT VARIABLES & SECRETS

Buat file `.env.local` (tidak boleh di-commit ke Git — pastikan ada di `.gitignore`):

```
# Database
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ailo?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_SECRET=<generate dengan: openssl rand -base64 32>
NEXTAUTH_URL=https://ailo.telkomuniversity.ac.id

# Groq API
GROQ_API_KEY=<api key dari console.groq.com>

# Mailer (Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email gmail pengirim>
SMTP_APP_PASSWORD=<16-digit app password dari Google Account>
SMTP_FROM_NAME=AILO Telkom University

# Image Storage (pilih salah satu)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Scopus API
SCOPUS_API_KEY=<dari dev.elsevier.com>

# Cron Secret (untuk proteksi endpoint cron)
CRON_SECRET=<random string>
```

⚠️ **PENTING:** Di server Biznet Gio Cloud, simpan file `.env.local` langsung di root project (permission file dibatasi `chmod 600` agar hanya bisa dibaca user `deployer`), dan pastikan file ini tidak pernah masuk ke Git (`.gitignore`). Untuk keamanan tambahan, pertimbangkan tools seperti `dotenv-vault` atau menyimpan secrets di password manager tim.

---

## 9. STRUKTUR FOLDER PROJECT

```
ailo-website/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    # Home
│   │   ├── research/
│   │   ├── projects/
│   │   ├── team/
│   │   ├── labs/
│   │   ├── news/
│   │   ├── about/
│   │   └── contact/
│   ├── admin/
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── news/
│   │   ├── research/
│   │   ├── projects/
│   │   ├── team/
│   │   ├── labs/
│   │   ├── bookings/
│   │   ├── settings/
│   │   ├── users/
│   │   └── chatbot/
│   └── api/
│       └── ... (sesuai bagian 7)
├── components/
│   ├── ui/                             # shadcn components
│   ├── chatbot/
│   │   ├── ChatbotWidget.tsx
│   │   └── ChatbotPopup.tsx
│   ├── accessibility/
│   │   └── TTSButton.tsx
│   ├── news/
│   ├── booking/
│   └── layout/
│       ├── Navbar.tsx
│       └── Footer.tsx
├── lib/
│   ├── mongodb.ts                      # koneksi MongoDB
│   ├── auth.ts                         # NextAuth config
│   ├── groq.ts                         # helper call Groq API
│   ├── mailer.ts                       # helper Nodemailer
│   ├── scopus.ts                       # helper fetch Scopus API
│   └── rag.ts                          # helper embedding & vector search
├── models/
│   ├── User.ts
│   ├── SiteSettings.ts
│   ├── News.ts
│   ├── Research.ts
│   ├── Project.ts
│   ├── Team.ts
│   ├── Lab.ts
│   ├── Device.ts
│   ├── Booking.ts
│   └── ChatEmbedding.ts
├── hooks/
│   └── useSiteSettings.ts
├── middleware.ts
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── package.json
└── README.md
```

---

## 10. ALUR KERJA (USER FLOW) KUNCI

### 10.1 Flow: Admin Membuat Berita AI
```
Admin Login → /admin/news/new → Isi 5W+1H → Upload gambar
→ Klik "Generate" → [API: /api/news/generate] → Groq API
→ Hasil tampil di editor → Admin review/edit → Klik "Publish"
→ Berita tayang di /news
```

### 10.2 Flow: Pengunjung Bertanya ke Chatbot
```
Pengunjung klik icon chatbot → Popup muncul → Ketik pertanyaan
→ [API: /api/chatbot/ask] → Embed pertanyaan → Vector search di MongoDB
→ Ambil konteks relevan → Kirim ke Groq API dengan konteks
→ Jawaban ditampilkan di popup
```

### 10.3 Flow: Peminjaman Lab
```
Pengunjung buka /labs/[slug] → Klik "Ajukan Peminjaman"
→ Isi form booking → Submit → [API: /api/bookings POST]
→ Cek bentrok jadwal → Simpan status "pending"
→ Email ke admin (notifikasi baru) + email ke peminjam (konfirmasi diterima)
→ Admin buka /admin/bookings → Approve/Reject
→ Email ke peminjam (hasil keputusan)
```

---

## 11. KEAMANAN & BEST PRACTICE

- [ ] Semua password di-hash dengan bcrypt (min. 10 salt rounds).
- [ ] Environment variables tidak pernah di-commit ke Git.
- [ ] Validasi input di semua form (client-side + server-side) menggunakan Zod.
- [ ] Rate limiting pada `/api/chatbot/ask`, `/api/contact`, `/api/bookings` untuk cegah spam/abuse.
- [ ] Sanitasi HTML pada konten rich text (News) untuk cegah XSS — gunakan library seperti `dompurify`.
- [ ] CORS dikonfigurasi hanya untuk domain resmi.
- [ ] HTTPS wajib — dikonfigurasi manual via Nginx + Let's Encrypt (Certbot) di server Biznet Gio Cloud, pastikan auto-renewal aktif.
- [ ] Role-based access control divalidasi di **setiap** API route admin, bukan hanya di UI.
- [ ] Backup database berkala (MongoDB Atlas punya fitur automated backup — aktifkan).
- [ ] Log error terpusat (misal Sentry) untuk monitoring production.

---

## 12. BUILD & DEPLOYMENT — STEP BY STEP

### Tahap 1: Setup Awal Project
```bash
npx create-next-app@latest ailo-website --typescript --tailwind --app
cd ailo-website
npm install mongoose next-auth bcryptjs zod nodemailer
npm install groq-sdk
npm install shadcn-ui
npx shadcn-ui@latest init
```

### Tahap 2: Setup MongoDB
1. Buat cluster di MongoDB Atlas (jika belum ada).
2. Whitelist IP (untuk development: `0.0.0.0/0` sementara, lalu perketat saat production).
3. Ambil connection string, masukkan ke `.env.local` sebagai `MONGODB_URI`.
4. Buat helper koneksi di `lib/mongodb.ts` (gunakan pola cached connection agar tidak reconnect setiap request).

### Tahap 3: Buat Models (Mongoose Schema)
- Implementasikan seluruh schema sesuai Bagian 6.

### Tahap 4: Setup Auth (NextAuth)
1. Konfigurasi `lib/auth.ts` dengan Credentials Provider.
2. Buat halaman `/admin/login`.
3. Buat `middleware.ts` untuk proteksi route `/admin/**`.
4. Seed 1 akun Super Admin pertama via script (`scripts/seed-admin.ts`) — **jangan** buat form registrasi publik untuk admin.

### Tahap 5: Bangun Modul Konten (CRUD Dasar)
Urutan pengerjaan yang disarankan (dari yang paling sederhana):
1. Site Settings (dasar untuk semua modul lain)
2. About Us
3. Team
4. Research
5. Projects
6. Labs & Devices
7. News (tanpa AI dulu — CRUD manual)
8. User Management

### Tahap 6: Integrasi Groq — News AI Generator
1. Daftar di [console.groq.com](https://console.groq.com), ambil API key.
2. Buat `lib/groq.ts` — fungsi `generateNewsContent(fiveW1H)`.
3. Buat prompt template yang menghasilkan format konsisten (judul, isi, ringkasan).
4. Hubungkan ke `/api/news/generate` dan UI di `/admin/news/new`.

### Tahap 7: Integrasi Chatbot RAG
1. Buat fungsi indexing: ambil semua konten published → chunking → embedding → simpan ke `ChatEmbedding`.
2. Setup **MongoDB Atlas Vector Search Index** pada koleksi `ChatEmbedding`.
3. Buat `/api/chatbot/ask`: query embedding → similarity search → compose prompt → call Groq → return jawaban.
4. Bangun UI floating widget (`ChatbotWidget.tsx` + `ChatbotPopup.tsx`).
5. Trigger re-index otomatis di setiap hook `post-save`/`post-update` pada model konten.

### Tahap 8: Modul Booking Lab & Perangkat
1. Buat model `Booking`, form publik, dan admin approval page.
2. Setup mailer (`lib/mailer.ts`) dengan Gmail App Password.
3. Buat template email (pending, approved, rejected) — bisa pakai HTML sederhana.
4. Implementasi validasi bentrok jadwal.

### Tahap 9: Integrasi Scopus
1. Ajukan API Key ke Elsevier Developer Portal (koordinasi dengan LPPM/Perpustakaan Telkom University untuk akses institusi).
2. Buat `lib/scopus.ts` — fungsi fetch data by Author ID.
3. Buat endpoint refresh manual + cron job mingguan (`/api/cron/scopus-sync`) via crontab Linux atau node-cron di server Biznet Gio Cloud.
4. Tampilkan di halaman `/team/[slug]`.

### Tahap 10: Aksesibilitas (TTS)
1. Buat komponen `TTSButton.tsx` menggunakan `window.speechSynthesis`.
2. Tempatkan di halaman News/Research/Project detail.
3. (Opsional v2) Ganti dengan API TTS eksternal jika kualitas suara browser dianggap kurang.

### Tahap 11: Testing
- Jalankan semua checklist di Bagian 14.

### Tahap 12: Deployment ke Biznet Gio Cloud (VPS)

Karena Biznet Gio Cloud adalah cloud server (bukan platform serverless), deployment dilakukan secara **self-managed**. Berikut langkah lengkapnya:

**A. Provisioning Server**
1. Buat instance Cloud Server di Biznet Gio Cloud (rekomendasi minimal: 2 vCPU, 4GB RAM untuk awal — sesuaikan dengan estimasi traffic).
2. Pilih OS: **Ubuntu 22.04 LTS** (paling umum & didukung luas).
3. Catat IP publik server, akses via SSH:
```bash
ssh root@<IP_SERVER_BIZNET>
```

**B. Setup Server Awal**
```bash
apt update && apt upgrade -y
apt install -y curl git nginx ufw

# Install Node.js (LTS) via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts

# Install PM2 (process manager agar app tetap jalan & auto-restart)
npm install -g pm2

# Setup firewall dasar
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

**C. Deploy Kode Aplikasi**
```bash
# Buat user non-root untuk menjalankan app (best practice keamanan)
adduser deployer
usermod -aG sudo deployer
su - deployer

# Clone repository
git clone <repo-url> ailo-website
cd ailo-website

# Install dependencies & build
npm install
cp .env.example .env.local   # lalu isi semua secrets (Bagian 8)
nano .env.local
npm run build

# Jalankan dengan PM2
pm2 start npm --name "ailo-web" -- start
pm2 save
pm2 startup   # ikuti instruksi yang muncul agar PM2 auto-start saat server reboot
```

**D. Setup Nginx sebagai Reverse Proxy**
Buat file konfigurasi `/etc/nginx/sites-available/ailo`:
```nginx
server {
    listen 80;
    server_name ailo.telkomuniversity.ac.id;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
```bash
ln -s /etc/nginx/sites-available/ailo /etc/nginx/sites-enabled/
nginx -t   # test konfigurasi
systemctl restart nginx
```

**E. Setup SSL (HTTPS) dengan Let's Encrypt**
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d ailo.telkomuniversity.ac.id
# Certbot otomatis update konfigurasi Nginx untuk HTTPS + auto-renewal
certbot renew --dry-run   # verifikasi auto-renewal berfungsi
```

**F. Arahkan Domain**
- Di DNS management domain `telkomuniversity.ac.id` (biasanya dikelola tim IT kampus), buat **A Record** yang mengarah ke IP publik server Biznet Gio Cloud.

**G. Setup Scheduled Job (pengganti Vercel Cron)**
Karena tidak pakai Vercel, cron job Scopus sync dijalankan dengan salah satu cara berikut:
- **Opsi 1 (direkomendasikan):** gunakan library `node-cron` langsung di dalam aplikasi Next.js (dijalankan sebagai background job saat app start via PM2).
- **Opsi 2:** gunakan **crontab Linux** yang memanggil endpoint internal:
```bash
crontab -e
# Tambahkan baris berikut (jalan tiap Senin jam 02:00):
0 2 * * 1 curl -X GET https://ailo.telkomuniversity.ac.id/api/cron/scopus-sync -H "Authorization: Bearer <CRON_SECRET>"
```

**H. CI/CD Sederhana (Opsional, direkomendasikan untuk update berikutnya)**
Karena tidak ada auto-deploy seperti Vercel, buat script deploy manual atau setup GitHub Actions untuk SSH otomatis:
```bash
# deploy.sh (dijalankan manual tiap ada update)
cd /home/deployer/ailo-website
git pull origin main
npm install
npm run build
pm2 restart ailo-web
```

### Tahap 13: Post-Deployment
- Jalankan script seed admin pertama langsung di server: `node scripts/seed-admin.js` (lalu hapus akses jika berupa endpoint API).
- Verifikasi node-cron/crontab Scopus sync berjalan (cek `pm2 logs ailo-web` atau `/var/log/syslog` untuk crontab).
- Uji kirim email dari production (Gmail App Password kadang perlu re-generate jika ada perubahan setting akun Google, dan pastikan IP server Biznet tidak diblokir Google karena dianggap mencurigakan — jika terjadi, gunakan **Google Workspace SMTP relay** sebagai alternatif).
- Setup monitoring: `pm2 monit` untuk cek resource real-time, dan pertimbangkan **Sentry** (error tracking) + **Uptime Robot/Better Uptime** (cek server hidup/mati) karena tidak ada dashboard bawaan seperti Vercel Analytics.
- Setup backup berkala: snapshot server di Biznet Gio Cloud (biasanya tersedia sebagai fitur di panel) + backup database MongoDB Atlas (otomatis jika pakai tier berbayar).
- Pertimbangkan setup **log rotation** (`pm2 install pm2-logrotate`) agar log tidak memenuhi disk server dari waktu ke waktu.

---

## 13. SETUP LAYANAN PIHAK KETIGA

### 13.1 Groq API
1. Daftar akun di [console.groq.com](https://console.groq.com).
2. Buat API Key baru.
3. Cek model yang tersedia (Llama 3.x atau model terbaru saat implementasi — **verifikasi ulang saat development karena daftar model Groq bisa berubah**).
4. Perhatikan rate limit tier gratis vs berbayar — untuk fitur chatbot + news generator yang dipakai bersamaan, pertimbangkan tier berbayar jika traffic tinggi.

### 13.2 Gmail App Password (Mailer)
1. Aktifkan **2-Step Verification** di akun Google yang akan dipakai.
2. Buka [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. Generate App Password baru (pilih "Mail" sebagai app).
4. Salin 16-digit password, masukkan ke `SMTP_APP_PASSWORD`.
5. **Catatan:** Gmail SMTP punya limit ~500 email/hari untuk akun biasa. Jika volume tinggi, pertimbangkan **Google Workspace** atau layanan transactional email (SendGrid/Resend) di fase berikutnya.

### 13.3 MongoDB Atlas
1. Buat cluster (Free Tier M0 cukup untuk awal, upgrade sesuai traffic).
2. Buat database user dengan password kuat.
3. Setup Network Access di MongoDB Atlas — whitelist **IP publik statis server Biznet Gio Cloud** (lebih aman dibanding `0.0.0.0/0`, karena IP server VPS bersifat tetap/tidak berubah-ubah seperti di platform serverless).
4. Aktifkan **Atlas Vector Search** (perlu cluster tier tertentu — cek ketersediaan fitur ini di tier yang dipilih).

### 13.4 Scopus API (Elsevier)
1. Daftar di [dev.elsevier.com](https://dev.elsevier.com/).
2. Ajukan API Key — untuk akses penuh biasanya perlu terhubung dari jaringan institusi yang berlangganan Scopus (IP-based access) atau melalui skema **Institutional Token**.
3. **Rekomendasi:** koordinasi dengan pihak LPPM/Perpustakaan Telkom University karena mereka kemungkinan sudah punya akses institusional yang bisa dimanfaatkan untuk API ini.

---

## 14. TESTING CHECKLIST

- [ ] Login admin berhasil dengan role yang benar (super_admin/admin/staff_lab).
- [ ] Site Settings — perubahan logo/warna langsung terlihat di frontend tanpa deploy ulang.
- [ ] Buat berita dengan 5W+1H → hasil generate AI masuk akal dan bisa diedit.
- [ ] Chatbot menjawab pertanyaan seputar AILO dengan akurat (uji dengan berbagai pertanyaan).
- [ ] Chatbot menolak/mengalihkan pertanyaan di luar topik AILO.
- [ ] Booking lab: tidak bisa double-booking di slot waktu sama.
- [ ] Email notifikasi booking terkirim (pending, approved, rejected) — cek folder spam juga.
- [ ] Data Scopus tampil benar di halaman Team untuk dosen yang terdaftar.
- [ ] TTS berfungsi di berbagai browser (Chrome, Safari, Firefox).
- [ ] Responsif di mobile, tablet, desktop.
- [ ] Semua form memiliki validasi & pesan error yang jelas.
- [ ] Role-based access: staff_lab tidak bisa akses User Management, dll.
- [ ] Load testing dasar untuk endpoint chatbot (concurrent users).

---

## 15. ROADMAP PENGEMBANGAN (FASE)

| Fase | Fitur | Prioritas |
|---|---|---|
| **Fase 1 (MVP)** | Halaman publik dasar, Site Settings, User Management, About, Team (tanpa Scopus dulu) | Tinggi |
| **Fase 2** | News AI Generator (Groq), Chatbot RAG, Labs & Booking dasar | Tinggi |
| **Fase 3** | Integrasi Scopus, Email notifikasi booking, TTS | Sedang |
| **Fase 4** | Optimasi performa, analytics, kalender booking visual, log aktivitas admin | Rendah |
| **Fase 5 (Opsional)** | AI image generation untuk berita, TTS API premium (ElevenLabs), multi-bahasa (EN/ID) | Opsional |

---

## CATATAN PENUTUP

Dokumen ini adalah panduan awal yang dapat disesuaikan seiring development berjalan. Beberapa hal yang perlu **divalidasi ulang saat implementasi**:
- Ketersediaan model embedding di Groq API (jika tidak ada, gunakan layanan embedding terpisah).
- Akses resmi Scopus API — sangat bergantung pada kebijakan langganan institusi Telkom University.
- Tier MongoDB Atlas yang mendukung Vector Search sesuai skala traffic yang diharapkan.

---
*Dokumen ini disusun sebagai Master Technical Specification untuk keperluan development internal AILO — Telkom University.*

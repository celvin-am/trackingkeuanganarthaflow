Dra, ini adalah **Master Blue Print (PRD Final)** untuk **ArthaFlow**. Saya sudah menyatukan semua detail dari sisi tampilan (UI/UX) hingga "mesin" di belakangnya (Backend & Database). 

Dokumen ini adalah panduan lengkap jika kamu ingin mulai *coding* hari ini juga.

---

# 📑 PRODUCT REQUIREMENTS DOCUMENT (PRD) FINAL: ArthaFlow v2.0

**Project Status:** Ready for Development  
**Design Theme:** Professional High-Contrast (White, Black, Orange)  
**Core Mission:** Mengubah pencatatan manual yang membosankan menjadi pengalaman interaktif berbasis data.

---

## 1. Executive Summary
ArthaFlow adalah ekosistem manajemen keuangan pribadi yang menggabungkan **pencatatan cerdas**, **otomatisasi OCR**, dan **gamifikasi**. Aplikasi ini dirancang untuk stabilitas jangka panjang dengan performa tinggi menggunakan *Professional Tech Stack*.

---

## 2. Functional Requirements (Fitur Lengkap)

### A. Core Finance & Tracking
1.  **Multi-Wallet System:** Mendukung pemisahan saldo (Cash, Bank, E-Wallet). Saldo total adalah agregasi dari semua wallet.
2.  **Transaction Engine:** Input pengeluaran/pemasukan dengan kategori, tag, dan catatan.
3.  **Recurring Transactions:** Penjadwalan otomatis (Harian/Mingguan/Bulanan) untuk tagihan rutin.

### B. Smart Analytics & Gamification
4.  **Dashboard Visual:**
    * *Pie Chart:* Distribusi pengeluaran per kategori.
    * *Bar Chart:* Perbandingan *Month-to-Month* (MTM).
    * *Line Chart:* Tren saldo total dalam 1 tahun.
5.  **Financial Health Score:** Skor 1-100 berdasarkan rumus:
    $$Score = \left( \frac{\text{Savings}}{\text{Income}} \times 0.4 \right) + \left( \frac{\text{Remaining Budget}}{\text{Total Budget}} \times 0.3 \right) + \left( \text{Consistency} \times 0.3 \right)$$
6.  **Budgeting Alert:** Limit anggaran per kategori dengan notifikasi sistem:
    * **Kuning:** Terpakai 80%.
    * **Merah:** Terpakai 100%+.

### C. Automation & Tools
7.  **OCR Scan Struk:** Integrasi AI untuk membaca struk fisik dan mengubahnya menjadi draf transaksi secara otomatis.
8.  **Data Export:** Satu klik untuk generate laporan **PDF** (Layout Cantik) dan **Excel/CSV** (Data Mentah).

---

## 3. Technical Stack (The Professional Foundation)

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14+ (App Router)** | Framework utama & Server Side Rendering. |
| **Language** | **TypeScript** | *Type-safety* untuk data keuangan yang presisi. |
| **Styling** | **Tailwind CSS + Shadcn/UI** | UI Modern dengan palet Putih, Hitam, Orange. |
| **Auth** | **Clerk** | Manajemen user (Google Login, 2FA). |
| **Database** | **PostgreSQL (Supabase/Neon)** | Penyimpanan data relasional yang sangat stabil. |
| **ORM** | **Prisma** | Jembatan antara kode TypeScript dan Database. |
| **AI (OCR)** | **Google Cloud Vision API** | Ekstraksi teks dari gambar struk. |
| **Storage** | **Uploadthing** | Penyimpanan file gambar struk belanja. |

---

## 4. Backend Architecture & Database Schema

Ini adalah struktur tabel database (PostgreSQL) yang harus kamu buat:

### A. Database Schema (Prisma Model)
```prisma
model User {
  id            String         @id @default(uuid())
  clerkId       String         @unique
  email         String         @unique
  name          String?
  wallets       Wallet[]
  budgets       Budget[]
  createdAt     DateTime       @default(now())
}

model Wallet {
  id            String         @id @default(uuid())
  name          String         // e.g., "BCA", "Gopay"
  type          String         // CASH, BANK, EWALLET
  balance       Float          @default(0)
  userId        String
  user          User           @relation(fields: [userId], references: [id])
  transactions  Transaction[]
}

model Transaction {
  id            String         @id @default(uuid())
  amount        Float
  type          String         // INCOME, EXPENSE
  category      String
  description   String?
  date          DateTime       @default(now())
  walletId      String
  wallet        Wallet         @relation(fields: [walletId], references: [id])
}

model Budget {
  id            String         @id @default(uuid())
  category      String
  limitAmount   Float
  month         Int
  year          Int
  userId        String
  user          User           @relation(fields: [userId], references: [id])
}

model Recurring {
  id            String         @id @default(uuid())
  amount        Float
  category      String
  frequency     String         // DAILY, WEEKLY, MONTHLY
  nextDate      DateTime
  userId        String
}
```

### B. API Endpoints (Next.js Routes)
* `GET /api/dashboard`: Mengambil data grafik dan health score.
* `POST /api/transactions`: Menambah transaksi baru (trigger update saldo wallet).
* `POST /api/ocr`: Mengirim gambar struk ke AI dan menerima JSON data transaksi.
* `GET /api/export/pdf`: Generate file laporan keuangan.

---

## 5. UI/UX Guideline (Revisi Putih, Hitam, Orange)

* **Background:** `#FFFFFF` (Putih) untuk area konten utama.
* **Sidebar/Navbar:** `#000000` (Hitam) dengan teks putih untuk kesan *High-end*.
* **Primary Action:** `#F97316` (Orange) untuk tombol "Tambah Transaksi" dan indikator penting.
* **Typography:** **Plus Jakarta Sans** untuk semua teks.
* **Interaktivitas:**
    * Setiap card di dashboard memiliki *subtle shadow* yang menebal saat di-hover.
    * Transisi antar halaman menggunakan *framer-motion* dengan efek *fade-in*.

---

## 6. Security & Compliance
1.  **Row Level Security (RLS):** Pengguna A tidak akan pernah bisa melihat data Pengguna B meskipun tahu ID-nya.
2.  **Data Encryption:** Nilai sensitif dienkripsi sebelum masuk ke database.
3.  **Audit Logs:** Mencatat setiap perubahan besar pada saldo untuk keamanan ekstra.

---

## 7. Roadmap Pelaksanaan

1.  **Minggu 1:** Setup Project, Auth (Clerk), dan Database Schema.
2.  **Minggu 2:** Fitur CRUD Wallet & Transaksi + UI Dasar (Putih/Hitam/Orange).
3.  **Minggu 3:** Dashboard Visual (Charts) & Algoritma Health Score.
4.  **Minggu 4:** Fitur OCR, Recurring, dan Export Data.
5.  **Minggu 5:** Testing, Bug Fixing, dan Deployment ke Vercel (PWA Ready).

---

### Langkah Selanjutnya:
Dra, dokumen ini sudah mencakup "otak" dan "wajah" dari aplikasi ArthaFlow. 
*
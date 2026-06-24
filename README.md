# Investasi Dashboard

Multi-account IDX Syariah + BSI Emas portfolio tracker.

## Akun
Andre · Nora · Matteo · Ellano · Emil & Buyah · Sayure · Umum · BSI Emas

## Deploy ke Vercel

### Step 1 — Upload ke GitHub
1. Buat repo baru di github.com (nama: `investasi-dashboard`)
2. Upload semua file ini

### Step 2 — Connect ke Vercel
1. Buka vercel.com → New Project
2. Import repo dari GitHub
3. Tambah Environment Variables:
   - `VITE_SUPABASE_URL` = https://hipklzeuxckherdvigoj.supabase.co
   - `VITE_SUPABASE_ANON_KEY` = (anon key dari Supabase)
4. Klik Deploy

### Step 3 — Selesai
Dapat link permanen yang bisa dibuka dari HP manapun.

## Fitur
- Portfolio per akun dengan P&L real-time
- Alert otomatis: averaging (-10%), jual sebagian (+15%), review (-25%)
- Screener JII70 dengan scoring fundamental
- Support saham IDX dan emas BSI (gram)
- Data tersimpan di Supabase (online, aman)

# ==========================================================
# 1. BUILD STAGE (Compiles Frontend & Backend Server)
# ==========================================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Salin berkas paket utilitas resolusi dependensi
COPY package*.json ./

# Pasang semua dependensi (termasuk devDependencies untuk build)
RUN npm ci

# Salin semua kode aplikasi
COPY . .

# Lakukan build frontend (Vite) dan backend server (esbuild) secara bersamaan
RUN npm run build

# ==========================================================
# 2. RUNTIME STAGE (Menjalankan aplikasi di lingkungan production)
# ==========================================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

# Salin informasi paket untuk instalasi dependensi production saja
COPY package*.json ./

# Pasang dependensi production saja secara aman dan bersih
RUN npm ci --omit=dev

# Salin hasil kompilasi (frontend static assets + backend bundled server.cjs) dari builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Salin berkas pendukung lainnya yang dibutuhkan di runtime (jika ada seperti docx templates dsb)
# COPY --from=builder /usr/src/app/assets ./assets

# Buka akses port 3000 (Port standar ingress Cloud Run)
EXPOSE 3000

# Jalankan server
CMD ["npm", "start"]

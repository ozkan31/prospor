# ProSpor - Fullstack (React + Express + MySQL)

## Kurulum

```bash
npm install
```

## .env

Proje kökünde `.env` dosyasında en az şu alanlar olmalı:

```env
DB_HOST=...
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
JWT_SECRET=super-secret
SERVER_PORT=3001
```

Opsiyonel frontend API URL:

```env
VITE_API_URL=/api
```

## Veritabani Hazirlama

```bash
npm run db:init
npm run db:seed
```

## Gelistirme

Frontend + backend birlikte:

```bash
npm run dev:all
```

Ayrica ayri ayri:

```bash
npm run dev
npm run dev:server
```

## Build

```bash
npm run build
npm run preview
```

## Veri Akislari

- Kullanici kayit/giris: MySQL (`users`)
- Urunler: MySQL (`products`)
- Favoriler: MySQL (`favorite_items`)
- Sepet: MySQL (`cart_items`)
- Adresler: MySQL (`user_addresses`)
- Siparisler: MySQL (`orders`, `order_items`)

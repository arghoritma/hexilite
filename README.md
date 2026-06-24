# Hexilite — Template Backend RESTful API

Template backend RESTful API ngagunakeun **HyperExpress** jeung **TypeScript**, geus dilengkepan sistem auténtikasi, manajemen database, WebSocket realtime, sarta caching Redis.

---

## Daptar Eusi

- [Téknologi nu Dipaké](#téknologi-nu-dipaké)
- [Fitur](#fitur)
- [Struktur Proyék](#struktur-proyék)
- [Syarat Sistem](#syarat-sistem)
- [Instalasi](#instalasi)
- [Pamakéan](#pamakéan)
- [API Endpoints](#api-endpoints)
- [WebSocket](#websocket)
- [Validasi](#validasi)
- [Kaamanan](#kaamanan)
- [NGINX Proxy](#nginx-proxy)
- [Lisensi](#lisensi)

---

## Téknologi nu Dipaké

| Téknologi | Katerangan |
|-----------|------------|
| **HyperExpress** | Framework web Node.js super gancang, didasaran ku µWebSockets (C++). 5-10× leuwih gancang batan Express.js |
| **TypeScript** | JavaScript kalawan tipe data pikeun ngurangan bug |
| **SQLite3** | Database SQL anu hampang tur basajan (bisa diganti MySQL, Postgres, jsb.) |
| **Knex.js** | SQL query builder tur migration tool |
| **JWT** | JSON Web Token pikeun auténtikasi |
| **Bcrypt** | Pikeun ngahash password jeung token |
| **Redis** | Caching sési pikeun aksés nu leuwih gancang |
| **ioredis** | Klien Redis pikeun Node.js |

### Perbandingan HyperExpress vs Express.js

| Skenario | Express.js | HyperExpress |
|----------|-----------|-------------|
| Route basajan (`/`) | 11.16k req/det | 75.14k req/det |
| Loba route (`/999`) | 4.63k req/det | 54.57k req/det |
| Middleware (`/90`) | 10.12k req/det | 61.92k req/det |
| Router nését (`/abccc/nested/ddd`) | 10.18k req/det | 51.15k req/det |
| File statis | 6.58k req/det | 32.45k req/det |
| Body urlencoded | 8.07k req/det | 50.52k req/det |

---

## Fitur

- [x] Auténtikasi lengkap (registrasi, login, refresh token, logout)
- [x] Manajemen sési multi-device
- [x] Refresh token rotasi (token anyar unggal refresh)
- [x] Caching sési ngagunakeun Redis
- [x] WebSocket realtime (broadcast ka sakabéh klien)
- [x] Middleware validasi input
- [x] Database migrations
- [x] TypeScript sapanjang kode
- [x] Hot-reload dina mode development

---

## Struktur Proyék

```
src/
├── index.ts                    # Entry point — nyetél server, middleware, WebSocket
├── knexfile.ts                 # Konfigurasi Knex (SQLite)
│
├── commands/
│   └── migrate-latest.ts       # Paréntah pikeun ngajalankeun migrasi
│
├── config/
│   ├── database.ts             # Konéksi Knex + migrasi otomatis
│   ├── native-database.ts      # Bungkus SQLite langsung (better-sqlite3)
│   └── dynamicDB.ts            # Manajemén database SQLite dinamis
│
├── controllers/                # Logic bisnis (pangatur rute)
│   ├── AuthController.ts       # Registrasi, login, refresh token, logout, sési
│   ├── UserController.ts       # Profil pamaké
│   └── WebSocketController.ts  # Broadcast via HTTP
│
├── database/migrations/        # File migrasi Knex
│   ├── 20250610032152_users.ts
│   ├── 20250610032201_sessions.ts
│   └── 20250616081237_refresh_tokens.ts
│
├── middlewares/                # Middleware HyperExpress
│   ├── auth.ts                 # Auténtikasi JWT + cék sési
│   ├── guard.ts                # JWT guard basajan
│   ├── validation.ts           # Validasi input umum
│   └── validations/
│       └── userValidation.ts   # Skéma validasi register & login
│
├── routes/                     # Definisi rute API
│   ├── index.ts                # Pangatur rute utama (/api)
│   ├── authRoutes.ts           # /api/auth/*
│   ├── userRoutes.ts           # /api/users/*
│   └── websocketRoutes.ts      # /api/ws/*
│
├── services/                   # Lapisan layanan (bisnis logic)
│   ├── auth.ts                 # Layanan auténtikasi
│   ├── redis.ts                # Layanan Redis (ioredis)
│   ├── session.ts              # Layanan manajemén sési
│   ├── sqlite.ts               # QueryBuilder SQLite sorangan
│   └── websocket.ts            # Layanan WebSocket + broadcast
│
├── types/
│   └── index.d.ts              # Tipe-tipe global (declaration merging)
│
└── utils/
    ├── hash.ts                 # Hashing bcrypt
    ├── helper.ts               # Pitulung tanggal
    └── jwt.ts                  # JWT sign / verify
```

### Alur Paménta

```
HTTP Request
    │
    ▼
Body Parser Middleware (nyieun req.body tina JSON)
    │
    ▼
Route /api/auth/login
    │
    ▼
Validation Middleware (mariksa input)
    │
    ▼
AuthController.login
    │
    ├── AuthService.login
    │   ├── SessionService.createSession
    │   ├── Sign JWT (access + refresh token)
    │   └── RedisService.set (cache sesi)
    │
    ▼
Response JSON ka klien
```

---

## Syarat Sistem

- Node.js 18+ (LTS disarankeun)
- npm atawa yarn
- Redis (opsional — aplikasi tetep jalan tanpa Redis)

---

## Instalasi

```bash
# 1. Kloning repositori
git clone https://github.com/arghoritma/hexilite.git
cd hexilite

# 2. Pasang sadaya dependensi
npm install

# 3. Jieun file .env
cp .env.example .env
# Édit .env eusina: PORT, JWT_SECRET, ACCESS_SECRET, REFRESH_SECRET, jsb.

# 4. Jalanan migrasi database
npm run migrate
```

### Conto `.env`

```env
PORT=3000
NODE_ENV=development
DB_NAME=hexilite

# JWT
ACCESS_SECRET=rahasia-access-anjeun
REFRESH_SECRET=rahasia-refresh-anjeun

# Redis (opsional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Pamakéan

### Development (kalawan hot-reload)

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Manajemén Database

```bash
# Jalanan migrasi
npm run migrate

# Balikkeun migrasi pamungkas
npm run migrate:rollback

# Jalanan seeder
npm run seed
```

### Docker

```bash
docker-compose up -d
```

---

## API Endpoints

### Auténtikasi

#### `POST /api/auth/register`
Registrasi pamaké anyar.

**Request:**
```json
{
  "name": "Ujang Anu",
  "email": "ujang@contoh.com",
  "password": "rahasia123"
}
```

**Response (201):**
```json
{
  "code": "REGISTER_SUCCESS",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-xxx",
      "name": "Ujang Anu",
      "email": "ujang@contoh.com",
      "createdAt": "2025-06-24T12:00:00.000Z"
    }
  }
}
```

---

#### `POST /api/auth/login`
Lebet ka akun.

**Request:**
```json
{
  "email": "ujang@contoh.com",
  "password": "rahasia123"
}
```

**Response:**
```json
{
  "code": "LOGIN_SUCCESS",
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid-xxx",
      "name": "Ujang Anu",
      "email": "ujang@contoh.com"
    },
    "session": {
      "sessionId": "uuid-yyy",
      "deviceId": "uuid-zzz",
      "expiresAt": "2025-07-24T12:00:00.000Z"
    }
  }
}
```

> `deviceId` téh opsional. Lamun teu dikirim, bakal dijieun otomatis (crypto.randomUUID).

---

#### `POST /api/auth/refresh-token`
Meunangkeun access token anyar.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "code": "REFRESH_SUCCESS",
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs... (anyar)",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs... (anyar)"
  }
}
```

> Unggal refresh, refresh token nu heubeul langsung dicabut (rotasi).

---

#### `GET /api/auth/logout`
Kaluar tina sési ayeuna (perlu auténtikasi).

**Response:**
```json
{
  "code": "LOGOUT_SUCCESS",
  "message": "Logout successful"
}
```

---

#### `GET /api/auth/logout-all`
Kaluar tina sakabéh alat (perlu auténtikasi).

**Response:**
```json
{
  "code": "LOGOUT_ALL_SUCCESS",
  "message": "Logged out from all devices successfully"
}
```

---

#### `GET /api/auth/sessions`
Nempo daptar sési nu aktif (perlu auténtikasi).

**Response:**
```json
{
  "code": "SUCCESS",
  "message": "Sessions retrieved successfully",
  "data": {
    "sessions": [
      {
        "sessionId": "uuid-yyy",
        "deviceId": "uuid-zzz",
        "userAgent": "Mozilla/5.0...",
        "ip": "192.168.1.1",
        "createdAt": "2025-06-24T12:00:00.000Z",
        "expiredAt": "2025-07-24T12:00:00.000Z"
      }
    ]
  }
}
```

---

### Pamaké

#### `GET /api/users/profile`
Meunangkeun profil pamaké (perlu auténtikasi).

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." http://localhost:3000/api/users/profile
```

**Response:**
```json
{
  "code": "SUCCESS",
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "uuid-xxx",
      "name": "Ujang Anu",
      "email": "ujang@contoh.com",
      "created_at": "2025-06-24T12:00:00.000Z",
      "updated_at": "2025-06-24T12:00:00.000Z"
    }
  }
}
```

---

### WebSocket

#### `POST /api/ws/broadcast`
Ngirim pesen ka sakabéh klien WebSocket nu nyambung.

**Request:**
```json
{
  "type": "notifikasi",
  "payload": {
    "pesan": "Halo dulur!"
  }
}
```

**Response:**
```json
{
  "code": "SUCCESS",
  "message": "Broadcast sent"
}
```

---

## WebSocket

Template ieu maké **WebSocket bawaan HyperExpress** (dumasar uWebSockets.js), lain `ws` atawa `socket.io`.

### Éndpoint

```
ws://localhost:3000/ws
```

### Cara Maké

Buka `public/ws-client.html` dina browser:
1. Klik **Connect WebSocket**
2. Klik **Send Test Broadcast** — atawa kirim HTTP `POST /api/ws/broadcast`
3. Sadaya klien nu nyambung bakal narima pesen sacara realtime

### Conto Kodeu (Broadcast via HTTP)

```bash
curl -X POST http://localhost:3000/api/ws/broadcast \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "payload": {"msg": "Halo ti HTTP!"}}'
```

### Kumaha Carana Gawé?

1. `WebSocketService` ngadaptarkeun rute WebSocket `/ws` kana server
2. Unggal klien nu nyambung disimpen dina `Set`
3. Waktu aya HTTP `POST /api/ws/broadcast`, `WebSocketController.broadcast()` ngagero `wsService.broadcast()`
4. Pesen dikirim ka sakabéh klien nu aya dina set

---

## Validasi

Middleware validasi nimbrung saméméh controller. Aturan validasi:

| Widang | Aturan |
|--------|--------|
| `name` | Wajib, 3–30 karakter |
| `email` | Wajib, format email valid |
| `password` | Wajib, 6–50 karakter |

Lamun validasi gagal, bakal meunang response:

```json
{
  "errors": {
    "email": "email format is invalid",
    "password": "password is required"
  }
}
```

---

## Kaamanan

- **Password** di-hash maké bcrypt (salt rounds: 4)
- **Refresh token** disimpen salaku hash (teu pernah disimpen atah)
- **JWT** ditandatanganan maké secret béda pikeun access jeung refresh token
- **Rotasi refresh token** — unggal refresh, token heubeul dicabut
- **Validasi input** sagala rupa pikeun nyegah injeksi
- **Konfigurasi sénsitip** maké environment variables
- **Sési aya waktuna** (30 poé)

### Alur Auténtikasi

```
Login
  │
  ├── Jieun sési anyar (user_sessions)
  ├── Jieun access token (15 menit)
  ├── Jieun refresh token (30 poé) → di-hash → disimpen (refresh_tokens)
  ├── Cache sési ka Redis (lamun Redis sadia)
  └── Balikkeun token ka klien

Request ka rute nu diamankeun
  │
  ├── Cek Bearer token dina header
  ├── Verifikasi JWT (access token)
  ├── Cek sési dina Redis (lamun sadia)
  ├── Lamun teu aya di Redis, cek database
  ├── Lamun sah, teruskeun ka controller
  └── Lamun henteu, balikkeun 401
```

### Sési & Redis Caching

Redis dipaké pikeun nyimpen sési sangkan teu kudu mindeng query database:

1. Waktu login, sési disimpen di Redis (expire: 30 poé)
2. Waktu auténtikasi, Redis dipariksa heula
3. Lamun sési aya di Redis, teu kudu query database
4. Lamun Redis turun, aplikasi tetep jalan maké database
5. Waktu logout, sési dihapus tina Redis

---

## Rute API Lengkap

| Method | Rute | Auténtikasi | Katerangan |
|--------|------|-------------|------------|
| POST | `/api/auth/register` | ✗ | Registrasi pamaké |
| POST | `/api/auth/login` | ✗ | Lebet ka akun |
| POST | `/api/auth/refresh-token` | ✗ | Anyarkeun token |
| GET | `/api/auth/sessions` | ✓ | Daptar sési aktif |
| GET | `/api/auth/logout` | ✓ | Kaluar sési ayeuna |
| GET | `/api/auth/logout-all` | ✓ | Kaluar sakabéh alat |
| GET | `/api/users/profile` | ✓ | Profil pamaké |
| POST | `/api/ws/broadcast` | ✗ | WebSocket broadcast |

---

## Manajemén Sési

Sési dipaké pikeun ngalacak alat nu asup ka akun:

- Unggal login nyieun sési anyar kalawan `deviceId`
- Sési boga waktos kadaluwarsa (30 poé)
- Sési bisa diliwat (`GET /api/auth/sessions`)
- Sési bisa ditumpurkeun sawilang (`logout`) atawa sakabéhna (`logout-all`)
- Lamun sési teu aktif, kudu login deui

### Tabel Database

```sql
-- users
id (uuid, PK)
name (text)
email (text, unique)
password (text, bcrypt hash)
created_at, updated_at (timestamp)

-- user_sessions
id (uuid, PK)
user_id (FK → users.id)
device_id (text)
ip_address (varchar 45)
user_agent (text)
is_active (boolean, default true)
created_at, last_used_at, expired_at (timestamp)

-- refresh_tokens
id (uuid, PK)
session_id (FK → user_sessions.id)
token_hash (text)
revoked (boolean, default false)
created_at, expired_at (timestamp)
```

---

## NGINX Proxy

Lamun ngagunakeun NGINX sabagé reverse proxy, ieu conto konfigurasina:

```nginx
server {
    listen 80;
    server_name domain-anjeun.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> Perhatoskeun `proxy_set_header Upgrade` jeung `Connection "upgrade"` — éta diperlukeun pikeun WebSocket.

---

## Lisensi

Dilisensikeun dina [ISC](https://opensource.org/licenses/ISC).

---

*Dijieun ku tim arghoritma — bandung, 2025*

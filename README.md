# ICTU AI JUDGE 🏆

Nền tảng thi đấu & đánh giá mô hình AI tự động dành cho sinh viên trường ICTU — mô hình Kaggle-like.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React + Vite + TypeScript + Tailwind CSS |
| **Backend** | FastAPI (Python) + SQLAlchemy |
| **Workers** | Celery + Redis |
| **Database** | PostgreSQL |
| **Storage** | MinIO (S3-compatible) |
| **Auth** | Google OAuth 2.0 (JWT/HttpOnly Cookie) |
| **Infrastructure** | Docker Compose |

---

## 🚀 Quick Start — Clone & Chạy trong 5 phút

### Bước 1 — Clone repo

```bash
git clone <repo-url>
cd ICTU-AI-JUDGE
```

### Bước 2 — Tạo file `.env` gốc

> ⚠️ File `.env` bị gitignore. Bạn **bắt buộc** phải tạo từ template.

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

Sau đó mở `.env` và **chỉ cần điền 2 giá trị** từ Google Cloud Console:

```env
GOOGLE_CLIENT_ID=<lấy từ Google Cloud Console>
GOOGLE_CLIENT_SECRET=<lấy từ Google Cloud Console>
```

> 📌 Mọi giá trị còn lại (DB, Redis, MinIO, JWT) đã có sẵn default để dev local — **không cần thay đổi**.

### Bước 3 — Chạy với Docker Compose

```bash
docker compose up -d --build
```

Docker sẽ tự động:
- Khởi động PostgreSQL, Redis, MinIO
- Chạy Alembic migration tạo toàn bộ 9 bảng
- Khởi tạo S3 bucket
- Build và serve Frontend qua Nginx

### Bước 4 — Kiểm tra

| Service | URL |
|---|---|
| **Web App** | http://localhost:3000 |
| **API Docs** | http://localhost:8000/docs |
| **MinIO Console** | http://localhost:9001 (admin/minioadmin) |

---

## 🔑 Lấy Google OAuth Credentials

1. Vào [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Tạo project mới (hoặc dùng project có sẵn)
3. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://localhost:5173` (cho dev mode)
6. Copy `Client ID` và `Client Secret` → điền vào `.env`

> ℹ️ `GOOGLE_CLIENT_ID` là public key, có thể chia sẻ trong team. Chỉ `GOOGLE_CLIENT_SECRET` mới là secret thực sự.

---

## 🛠️ Phát triển Local (không dùng Docker)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/macOS

pip install -r requirements.txt

# Chạy server
uvicorn app.entrypoints.api.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Tạo .env cho Vite dev server
cp .env.example .env
# Điền VITE_GOOGLE_CLIENT_ID vào frontend/.env

npm install
npm run dev    # http://localhost:5173
```

> ⚠️ **Lưu ý:** Khi dev local, bạn vẫn cần PostgreSQL, Redis, MinIO chạy. Dùng Docker cho infrastructure:
> ```bash
> docker compose up -d db redis minio
> ```

---

## 📁 Cấu trúc file `.env`

### Root `.env` (dùng cho Docker Compose + Backend)

| Biến | Mô tả | Cần thay? |
|---|---|---|
| `POSTGRES_*` | Cấu hình database | ❌ |
| `REDIS_URL` | Kết nối Redis | ❌ |
| `MINIO_*` / `S3_*` | Object storage | ❌ |
| `SECRET_KEY` | JWT signing key | ⚠️ Production only |
| `GOOGLE_CLIENT_ID` | **Google OAuth Client ID** | ✅ **Bắt buộc** |
| `GOOGLE_CLIENT_SECRET` | **Google OAuth Secret** | ✅ **Bắt buộc** |
| `VITE_GOOGLE_CLIENT_ID` | Build arg cho Frontend | ✅ (= GOOGLE_CLIENT_ID) |

### `frontend/.env` (chỉ dùng khi dev local với `npm run dev`)

```env
VITE_GOOGLE_CLIENT_ID=<same as GOOGLE_CLIENT_ID>
```

> ✅ Khi chạy bằng `docker compose up`, file `frontend/.env` **KHÔNG cần thiết** —
> `VITE_GOOGLE_CLIENT_ID` được truyền tự động qua `docker-compose.yml` build args.

---

## 📋 Database Schema

Toàn bộ 9 bảng được tạo tự động bởi Alembic migration khi khởi động:

- `users` — Tài khoản sinh viên
- `challenges` — Bài thi
- `teams` — Đội thi (1 người = 1 đội)
- `team_members` — Thành viên đội
- `challenge_participants` — Whitelist tham gia
- `submissions` — Lịch sử nộp bài
- `leaderboard_entries` — Bảng xếp hạng
- `solutions` — Giải pháp chia sẻ (Kernels)
- `solution_upvotes` — Upvote giải pháp (chống double-vote)

---

## 🔒 Lưu ý Bảo mật

- JWT Token lưu trong **HttpOnly Cookie** (chống XSS)
- Code submission chạy trong **Docker Sandbox** (cô lập)
- File nộp bài qua **MD5 dedup** (chống spam)
- Bảng xếp hạng dùng **Pessimistic Locking** (chống race condition)
- Dữ liệu quan trọng dùng **Soft Delete** (`deleted_at`)

---

## Git Commit Convention

```
feat(scope): description
fix(scope): description
docs(scope): description
refactor(scope): description
```

Ví dụ: `feat(leaderboard): implement pessimistic locking for score update`

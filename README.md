<div align="center">

# 🏆 ICTU AI JUDGE

**Nền tảng thi đấu & đánh giá mô hình AI tự động dành cho sinh viên ICTU**

*Được xây dựng theo mô hình Kaggle-like — Công bằng · Tự động · Bảo mật*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://vitejs.dev)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Celery](https://img.shields.io/badge/Workers-Celery%20%2B%20Redis-37814A?style=for-the-badge&logo=celery&logoColor=white)](https://docs.celeryq.dev)
[![Docker](https://img.shields.io/badge/Infrastructure-Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

</div>

---

## 📖 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng nổi bật](#-tính-năng-nổi-bật)
- [Tech Stack](#-tech-stack)
- [Kiến trúc hệ thống](#️-kiến-trúc-hệ-thống)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Quick Start — Chạy trong 5 phút](#-quick-start--chạy-trong-5-phút)
- [Phát triển Local (không dùng Docker)](#️-phát-triển-local-không-dùng-docker)
- [Cấu hình môi trường (.env)](#️-cấu-hình-môi-trường-env)
- [Lấy Google OAuth Credentials](#-lấy-google-oauth-credentials)
- [Database Schema](#️-database-schema)
- [Luồng xử lý nộp bài](#-luồng-xử-lý-nộp-bài)
- [Bảo mật](#-bảo-mật)
- [Quy tắc Git & Đóng góp](#-quy-tắc-git--đóng-góp)
- [Tài liệu tham chiếu](#-tài-liệu-tham-chiếu)

---

## 🎯 Giới thiệu

**ICTU AI JUDGE** là nền tảng tổ chức và luyện tập các bài toán Trí tuệ Nhân tạo (AI) / Học máy (ML) dành riêng cho sinh viên trường Đại học Công nghệ Thông tin và Truyền thông (ICTU).

Hệ thống phục vụ **hai mục đích chính**:

| Mục đích | Mô tả |
|---|---|
| 🎓 **Luyện tập tự do** | Public Challenges — Sinh viên tự do ghi danh, nộp bài và theo dõi thứ hạng |
| 🥇 **Thi đấu chính thức** | Competitions — Tổ chức các kỳ thi Olympic AI cấp trường, có kiểm soát danh sách tham gia |

> **Lưu ý:** Chỉ sinh viên tham gia giải đấu mới được cấp quyền đăng nhập, đảm bảo tính toàn vẹn của cuộc thi.

---

## ✨ Tính năng nổi bật

### Dành cho Sinh viên (Thí sinh)

- 🔐 **Đăng nhập bằng Google** — Xác thực danh tính tự động, không cần đăng ký thủ công
- 🤝 **Thi đội hoặc cá nhân** — Tạo đội, mời thành viên qua email, trưởng nhóm quản lý danh sách
- 📤 **Nộp bài (Submit)** — Upload file kết quả `.csv`, hệ thống tự động chấm điểm ngầm (background)
- 📊 **Bảng xếp hạng real-time** — Public Leaderboard cập nhật tức thì sau mỗi lần nộp
- 🎯 **Chọn bài thi Private** — Sinh viên tự chọn bài nộp tốt nhất để dùng cho vòng chấm chung cuộc (chống Overfitting)
- 📜 **Lịch sử nộp bài** — Xem chi tiết từng lần nộp: điểm số, trạng thái, thời gian chấm

### Dành cho Admin (Ban tổ chức)

- 🛠️ **Quản lý bài thi toàn diện** — Tạo/Sửa/Xóa Public Challenges & Competitions, soạn đề bằng Markdown
- 📐 **Cấu hình metrics linh hoạt** — Accuracy, RMSE, F1, hoặc **Custom Metric** bằng file `metric.py`
- 🔒 **Kiểm soát quyền thi** — Import danh sách whitelist sinh viên tham gia Competition
- 🗑️ **Quản lý lưu trữ thông minh** — Chỉ giữ file CSV điểm cao nhất và gần nhất, tự động dọn file rác
- 🕵️ **Chống gian lận** — Tải source code của thí sinh để hội đồng kiểm chứng kết quả

### Cơ chế Anti-Cheat & Tính công bằng

| Cơ chế | Mô tả |
|---|---|
| 🚫 **Anti-Spam (MD5)** | File nộp bài bị hash MD5, nộp file trùng → từ chối ngay, không tốn tài nguyên Worker |
| ⏱️ **Rate Limit** | Bắt buộc chờ (VD: 10 phút) giữa 2 lần nộp, áp dụng cho cả đội |
| ⚖️ **Tie-breaking** | Cùng điểm → ưu tiên đội có **thời gian nộp bài sớm hơn** |
| 🕵️ **Private Board** | Điểm chung cuộc dựa trên tập dữ liệu Private ẩn — Sinh viên không biết đang overfitting |
| 🔐 **Ground Truth ẩn** | File đáp án Admin upload thẳng lên S3, không bao giờ expose ra API |

---

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ICTU AI JUDGE                                   │
├───────────────────┬─────────────────────────────────────────────────────────┤
│   Frontend        │  React 18 + Vite + TypeScript + Tailwind CSS            │
│                   │  Kiến trúc MVVM — Zustand (Global Store)                │
├───────────────────┼─────────────────────────────────────────────────────────┤
│   Backend         │  FastAPI (Python) + SQLAlchemy ORM + Pydantic           │
│                   │  Kiến trúc Hexagonal (Ports & Adapters)                 │
├───────────────────┼─────────────────────────────────────────────────────────┤
│   Database        │  PostgreSQL 16 — Pessimistic Locking (SELECT FOR UPDATE)│
├───────────────────┼─────────────────────────────────────────────────────────┤
│   Message Broker  │  Redis 7 — Job Queue + Rate Limit Cache                 │
├───────────────────┼─────────────────────────────────────────────────────────┤
│   Background Jobs │  Celery Workers — Chấm điểm bất đồng bộ                │
├───────────────────┼─────────────────────────────────────────────────────────┤
│   Sandbox         │  Docker-in-Docker — Chạy Custom Metric an toàn          │
├───────────────────┼─────────────────────────────────────────────────────────┤
│   Storage         │  MinIO (S3-compatible) — Lưu Submission CSV + GT        │
├───────────────────┼─────────────────────────────────────────────────────────┤
│   Auth            │  Google OAuth 2.0 + JWT lưu trong HttpOnly Cookie       │
└───────────────────┴─────────────────────────────────────────────────────────┘
```

---

## 🏗️ Kiến trúc hệ thống

### Sơ đồ tổng thể

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Trình duyệt Sinh viên / Admin                    │
└───────────────────────────────┬──────────────────────────────────────┘
                                │  HTTP/REST (HttpOnly Cookie)
┌───────────────────────────────▼──────────────────────────────────────┐
│                     FRONTEND (React MVVM)                            │
│                                                                      │
│   Views (Dumb Components)                                            │
│      ↕ Data binding                                                  │
│   ViewModels (Custom Hooks: useAuthVM, useChallengeVM...)            │
│      ↕ Subscribe / Dispatch                                          │
│   Zustand Store (Global: Auth, Theme)                                │
│      ↕ REST API call                                                 │
│   Services (authService, challengeService...)                        │
└───────────────────────────────┬──────────────────────────────────────┘
                                │  REST API
┌───────────────────────────────▼──────────────────────────────────────┐
│                     BACKEND (FastAPI Hexagonal)                      │
│                                                                      │
│   Entrypoints (FastAPI Routers) → JWT verify từ Cookie              │
│      ↓ Dependency Injection (Depends)                                │
│   Application (Use Cases) → Logic nghiệp vụ thuần túy               │
│      ↓ Ports (Interfaces)                                            │
│   Adapters (Database / S3 / Celery / Redis)                         │
└──────────────┬───────────────────────────────┬───────────────────────┘
               │                               │
    ┌──────────▼──────────┐        ┌───────────▼────────────┐
    │   PostgreSQL 16     │        │   Redis 7              │
    │   (Pessimistic      │        │   (Job Queue +         │
    │    Locking)         │        │    Rate Limit)         │
    └─────────────────────┘        └───────────┬────────────┘
                                               │ Job Queue
                                   ┌───────────▼────────────┐
                                   │   Celery Worker        │
                                   │   (Chấm điểm ngầm)     │
                                   └───────────┬────────────┘
                                               │ Docker API
                                   ┌───────────▼────────────┐
                                   │  Docker Sandbox        │
                                   │  (Container 1 lần,     │
                                   │   chạy metric.py       │
                                   │   an toàn, tự hủy)     │
                                   └───────────┬────────────┘
                                               │ Đọc/Ghi file
                                   ┌───────────▼────────────┐
                                   │   MinIO (S3)           │
                                   │   Submission CSV +     │
                                   │   Ground Truth         │
                                   └────────────────────────┘
```

### Kiến trúc Backend — Hexagonal (Ports & Adapters)

Nguyên tắc cốt lõi: **Domain không biết gì về FastAPI hay SQLAlchemy**. Mọi logic nghiệp vụ tồn tại thuần túy trong `domain/` và `application/`.

```
Request HTTP
    │
    ▼
[Entrypoints] — FastAPI Router, JWT Middleware
    │  gọi Use Case qua Depends()
    ▼
[Application] — Use Cases (SubmitPredictionUseCase, GoogleLoginUseCase...)
    │  gọi Ports (Interfaces)
    ├────────────────────────────────────────────┐
    ▼                                            ▼
[Domain]                                  [Adapters]
Entities, Rules, Exceptions               Database (SQLAlchemy)
(Không phụ thuộc Framework)               Storage (MinIO/S3)
                                          Worker (Celery/Redis)
```

### Kiến trúc Frontend — MVVM

```
View (TSX Component)      — Render UI, nhận Props, KHÔNG gọi API trực tiếp
    ↕
ViewModel (Custom Hooks)  — Fetch dữ liệu, format, pagination, expose cho View
    ↕
Zustand Store             — Global state: Auth user, Theme
    ↕
Service Layer             — Gọi API qua Axios, map response về TypeScript Types
```

---

## 📁 Cấu trúc thư mục

```
ICTU-AI-JUDGE/
├── 📄 docker-compose.yml          # Orchestrate toàn bộ 6 services
├── 📄 .env.example                # Template cấu hình môi trường
├── 📄 sample_solution.ipynb       # Notebook mẫu dành cho thí sinh
│
├── 📂 docs/                       # Tài liệu dự án
│   ├── openapi.yaml               # API Specification (viết TRƯỚC khi code)
│   ├── erd.md                     # Entity Relationship Diagram
│   ├── System_Architecture.md     # Kiến trúc hệ thống chi tiết
│   ├── BA.md                      # Business Requirements Document
│   └── UC.md                      # Use Case Diagram & Descriptions
│
├── 📂 backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic/                   # Database migrations
│   └── app/
│       ├── core/                  # Config, Security (JWT / HttpOnly Cookie)
│       ├── domain/                # Entities, Domain Rules, Exceptions
│       │   ├── entities/
│       │   ├── exceptions/
│       │   └── value_objects/
│       ├── application/           # Use Cases & Ports (Interfaces)
│       │   ├── use_cases/         # Business Logic thuần túy
│       │   ├── interfaces/        # Outbound Ports (Repository contracts)
│       │   └── dtos/              # Data Transfer Objects
│       ├── adapters/              # Outbound Adapters
│       │   ├── database/          # SQLAlchemy Repositories (Pessimistic Locking)
│       │   ├── storage/           # MinIO/S3 Adapter
│       │   └── worker/            # Celery Tasks + Docker Sandbox
│       └── entrypoints/           # Inbound Adapters
│           ├── api/v1/            # FastAPI Routers
│           └── dependencies.py    # Dependency Injection (Depends)
│
└── 📂 frontend/
    └── src/
        ├── core/                  # Axios client (withCredentials: true)
        ├── models/                # TypeScript Types (từ OpenAPI spec)
        ├── services/              # API Service Layer (authService, challengeService...)
        ├── store/                 # Zustand Global Store (Auth, Theme)
        ├── viewmodels/            # Custom Hooks (useAuthVM, useChallengeVM...)
        └── views/
            ├── components/        # Shared Components
            ├── layouts/           # Page Layouts
            └── pages/             # Page Components (Dumb Views)
```

---

## 🚀 Quick Start — Chạy trong 5 phút

### Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (bao gồm Docker Compose v2)
- Tài khoản Google Cloud để lấy OAuth Credentials

### Bước 1 — Clone repo

```bash
git clone https://github.com/Cong-ty-TNNH-Q-Tech/ICTU-AI-JUDGE.git
cd ICTU-AI-JUDGE
```

### Bước 2 — Tạo file `.env`

> ⚠️ File `.env` bị gitignore. Bắt buộc phải tạo từ template trước khi chạy.

```bash
# Linux / macOS
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Mở file `.env` vừa tạo và **điền 3 giá trị** từ Google Cloud Console:

```env
GOOGLE_CLIENT_ID=<lấy từ Google Cloud Console>
GOOGLE_CLIENT_SECRET=<lấy từ Google Cloud Console>
VITE_GOOGLE_CLIENT_ID=<giống GOOGLE_CLIENT_ID>
```

> 📌 Tất cả các giá trị còn lại (DB, Redis, MinIO, JWT) đã có sẵn default để dev local — **không cần thay đổi**.

### Bước 3 — Build & chạy

```bash
docker compose up -d --build
```

Docker Compose sẽ tự động khởi động **6 services** theo thứ tự phụ thuộc:

| # | Service | Mô tả |
|:---:|---|---|
| 1 | `db` — PostgreSQL 16 | Database chính, có healthcheck sẵn |
| 2 | `redis` — Redis 7 | Message broker cho Celery, Rate limit cache |
| 3 | `minio` — MinIO | Object storage S3-compatible |
| 4 | `backend` — FastAPI | Chạy `alembic upgrade head` tạo 9 bảng, rồi start server |
| 5 | `worker` — Celery | Background scoring worker, mount Docker socket (DooD) |
| 6 | `frontend` — React/Nginx | Build Vite với `VITE_GOOGLE_CLIENT_ID`, serve qua Nginx |

### Bước 4 — Truy cập ứng dụng

| Service | URL | Ghi chú |
|---|---|---|
| 🌐 **Web App** | http://localhost:3000 | Giao diện sinh viên & admin |
| 📋 **API Docs (Swagger)** | http://localhost:8000/docs | Interactive API documentation |
| 📋 **API Docs (ReDoc)** | http://localhost:8000/redoc | Tài liệu API dạng đẹp hơn |
| 🗄️ **MinIO Console** | http://localhost:9001 | Quản lý file storage (admin/minioadmin) |

### Bước 5 — Kiểm tra trạng thái

```bash
# Xem logs toàn bộ services
docker compose logs -f

# Xem logs riêng từng service
docker compose logs -f backend
docker compose logs -f worker

# Kiểm tra trạng thái containers
docker compose ps
```

### Dừng & Dọn dẹp

```bash
# Dừng tất cả (giữ lại data volumes)
docker compose down

# Dừng và xóa toàn bộ data (reset hoàn toàn)
docker compose down -v
```

---

## 🛠️ Phát triển Local (không dùng Docker)

Khi phát triển local, bạn chỉ cần chạy các services infrastructure qua Docker, còn Backend và Frontend chạy trực tiếp trên máy để có hot-reload.

### Bước 1 — Khởi động infrastructure

```bash
# Chỉ chạy DB, Redis, MinIO — không build Backend/Frontend
docker compose up -d db redis minio
```

### Bước 2 — Chạy Backend

```bash
cd backend

# Tạo virtual environment
python -m venv venv

# Activate (Linux/macOS)
source venv/bin/activate

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Cài đặt dependencies
pip install -r requirements.txt

# Chạy migrations tạo bảng
alembic upgrade head

# Khởi động development server (hot-reload)
uvicorn app.entrypoints.api.main:app --reload --port 8000
```

> API server chạy tại: **http://localhost:8000**

### Bước 3 — Chạy Frontend

```bash
cd frontend

# Tạo .env cho Vite dev server
cp .env.example .env
# Sau đó điền VITE_GOOGLE_CLIENT_ID vào frontend/.env

# Cài đặt dependencies
npm install

# Khởi động dev server (hot-reload)
npm run dev
```

> Frontend dev server chạy tại: **http://localhost:5173**

### Bước 4 — Chạy Celery Worker

Worker cần thiết để chạy tính năng chấm điểm tự động.

```bash
cd backend
source venv/bin/activate

# Chạy Celery worker
celery -A app.adapters.worker.celery_app worker --loglevel=info
```

> ⚠️ Worker cần Docker đang chạy để có thể spin up Docker Sandbox cho `metric.py`. Đảm bảo Docker Desktop đang hoạt động.

---

## ⚙️ Cấu hình môi trường (.env)

### Root `.env` — Dùng cho Docker Compose và Backend

| Biến | Default | Bắt buộc thay? | Mô tả |
|---|---|:---:|---|
| `POSTGRES_USER` | `ictu_ai_judge` | ❌ | Username PostgreSQL |
| `POSTGRES_PASSWORD` | `ictu_ai_judge_password` | ❌ | Password PostgreSQL |
| `POSTGRES_DB` | `ictu_ai_judge` | ❌ | Tên database |
| `DATABASE_URL` | `postgresql+psycopg2://...` | ❌ | Connection string đầy đủ |
| `REDIS_URL` | `redis://redis:6379/0` | ❌ | Redis cho cache/rate limit |
| `CELERY_BROKER_URL` | `redis://redis:6379/1` | ❌ | Redis cho Celery job queue |
| `CELERY_RESULT_BACKEND` | `redis://redis:6379/2` | ❌ | Redis cho Celery results |
| `MINIO_ROOT_USER` | `minioadmin` | ❌ | MinIO admin username |
| `MINIO_ROOT_PASSWORD` | `minioadmin` | ❌ | MinIO admin password |
| `S3_ENDPOINT_URL` | `http://minio:9000` | ❌ | Endpoint nội bộ Docker |
| `S3_PUBLIC_ENDPOINT_URL` | `http://localhost:9000` | ❌ | Endpoint trình duyệt truy cập |
| `S3_ACCESS_KEY` | `minioadmin` | ❌ | S3 access key |
| `S3_SECRET_KEY` | `minioadmin` | ❌ | S3 secret key |
| `S3_BUCKET_NAME` | `ictu-ai-judge-bucket` | ❌ | Tên bucket lưu file |
| `SECRET_KEY` | `super-secret-key-...` | ⚠️ Production | JWT signing key |
| `ALGORITHM` | `HS256` | ❌ | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | ❌ | JWT access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | ❌ | JWT refresh token TTL |
| `APP_ENV` | `development` | ❌ | Môi trường chạy |
| **`GOOGLE_CLIENT_ID`** | — | ✅ **Bắt buộc** | Google OAuth Client ID |
| **`GOOGLE_CLIENT_SECRET`** | — | ✅ **Bắt buộc** | Google OAuth Client Secret |
| **`VITE_GOOGLE_CLIENT_ID`** | — | ✅ **Bắt buộc** | Build arg cho Frontend (= GOOGLE_CLIENT_ID) |

### `frontend/.env` — Chỉ dùng khi dev local với `npm run dev`

```env
VITE_GOOGLE_CLIENT_ID=<same as GOOGLE_CLIENT_ID>
```

> ✅ Khi chạy bằng `docker compose up`, file `frontend/.env` **không cần thiết** — `VITE_GOOGLE_CLIENT_ID` được truyền tự động qua build args trong `docker-compose.yml`.

---

## 🔑 Lấy Google OAuth Credentials

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
4. Chọn **Application type: Web application**
5. Cấu hình **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   http://localhost:5173
   ```
6. Cấu hình **Authorized redirect URIs**:
   ```
   http://localhost:8000/auth/google/callback
   ```
7. Nhấn **Create** → Copy **Client ID** và **Client Secret** → Điền vào `.env`

> ℹ️ `GOOGLE_CLIENT_ID` là public key, có thể chia sẻ trong team. Chỉ `GOOGLE_CLIENT_SECRET` mới là secret thực sự — **không được commit lên Git**.

---

## 🗄️ Database Schema

Toàn bộ **9 bảng** được tạo tự động bởi Alembic migration khi khởi động:

```
users                      — Tài khoản sinh viên (Soft Delete)
  └── team_members         — Thành viên đội (Many-to-Many bridge)

challenges                 — Bài thi / Cuộc thi (Soft Delete)
  ├── challenge_participants — Whitelist tham gia Competition
  └── teams                — Đội thi (Soft Delete)
        ├── team_members
        ├── team_invites   — Lời mời vào đội (token + expires_at)
        ├── submissions    — Lịch sử nộp bài
        └── leaderboard_entries — Bảng xếp hạng (vật lý hóa)
```

### Nguyên tắc "Team of 1"

Khi sinh viên tham gia thi cá nhân, hệ thống **tự động tạo 1 Team** chỉ có 1 thành viên. Toàn bộ logic Query và Xếp hạng đều dựa trên `team_id` — không bao giờ dùng `user_id` trực tiếp.

### Bảng `submissions` — Cốt lõi của hệ thống

| Cột | Kiểu | Mô tả |
|---|---|---|
| `file_md5_hash` | `VARCHAR` | Hash MD5 file CSV — Anti-spam, unique index per (team + challenge) |
| `file_size_bytes` | `INTEGER` | Kích thước thực tế (bytes) — hỗ trợ Storage Retention |
| `public_score` | `DOUBLE PRECISION` | Điểm tính trên tập Public |
| `private_score` | `DOUBLE PRECISION` | Điểm tính trên tập Private ẩn |
| `is_selected_for_private` | `BOOLEAN` | Sinh viên tự chọn bài để tính chung cuộc |
| `status` | `ENUM` | `PENDING → PROCESSING → SUCCESS / FAILED` |
| `execution_time_ms` | `INTEGER` | Thời gian Worker chấm (ms) — phát hiện Worker treo |
| `error_message` | `TEXT` | Log lỗi chi tiết nếu Worker chấm thất bại |

### Bảng `leaderboard_entries` — Xếp hạng vật lý hóa

| Cột | Kiểu | Mô tả |
|---|---|---|
| `best_public_score` | `DOUBLE PRECISION` | Điểm Public cao nhất của đội |
| `best_private_score` | `DOUBLE PRECISION` | Điểm Private của bài được chọn |
| `last_submission_time` | `TIMESTAMP` | **Tie-break** — điểm bằng nhau, ai nộp sớm hơn thắng |
| `best_private_submission_id` | `UUID (FK, nullable)` | `NULL` → Fallback sang bài Public tốt nhất |

> 📄 Xem thiết kế ERD đầy đủ tại [`docs/erd.md`](docs/erd.md)

---

## 📬 Luồng xử lý nộp bài

```
Sinh viên nhấn "Submit" (Upload file CSV)
          │
          ▼
  [FastAPI Router]
  1. Xác thực JWT từ HttpOnly Cookie
  2. Kiểm tra rate limit qua Redis TTL
          │
          ▼
  [Use Case: SubmitPredictionUseCase]
  1. Kiểm tra hạn nộp bài (end_time)
  2. Kiểm tra rate limit (thời gian nộp trước của đội)
  3. Tính MD5 hash → Nếu trùng → HTTP 409 (từ chối ngay)
  4. Validate định dạng file (cột, kích thước tối đa)
          │
          ▼
  [Adapter: Storage]
  Upload file CSV lên MinIO/S3
          │
          ▼
  [Adapter: Database]
  INSERT vào bảng submissions (status: PENDING)
          │
          ▼
  [Adapter: Worker]
  PUSH submission_id vào Redis Queue
          │
  ← Trả về HTTP 201 ACCEPTED ngay lập tức ───────┐
                                                   │
  (Background — không block user)                  │
  [Celery Worker] consume job từ Redis             │
  1. Tải Ground Truth + Submission CSV từ S3       │
  2. [Docker Sandbox]                              │
     → Spin up Container 1 lần (giới hạn RAM/CPU)  │
     → Truyền 2 file CSV vào Container             │
     → Container chạy metric.py, nhả điểm ra stdout│
     → Container tự hủy hoàn toàn                 │
  3. [Database] UPDATE submissions: điểm, status   │
  4. [Database — Pessimistic Locking]              │
     SELECT ... FOR UPDATE trên leaderboard_entries│
     → Cập nhật best_score nếu là kỷ lục mới       │
     (Chống race condition khi 3 người nộp cùng lúc)│
                                                   │
  Sinh viên F5 → thấy điểm mới trên Leaderboard ───┘
```

---

## 🔒 Bảo mật

| Lớp bảo vệ | Cơ chế | Chi tiết |
|---|---|---|
| **Xác thực (Auth)** | Google OAuth 2.0 + JWT | Token lưu trong `HttpOnly Cookie` — JS không thể đọc (chống XSS) |
| **Chạy code lạ (RCE)** | Docker Sandbox (DooD) | `metric.py` chạy trong Container 1 lần, bị giới hạn RAM/CPU, chặn network — Tuyệt đối không `import` trực tiếp |
| **Anti-Spam** | MD5 Deduplication | Hash file trước khi xử lý, nộp file trùng → reject ngay `HTTP 409`, Worker không bị tốn |
| **Race Condition** | Pessimistic Locking | `SELECT ... FOR UPDATE` khi cập nhật Leaderboard — Đảm bảo thứ hạng chính xác dù 100 người nộp cùng lúc |
| **Data Integrity** | Soft Delete | `users`, `challenges`, `teams` không bao giờ bị `DELETE` — Dùng cột `deleted_at` |
| **Ground Truth** | Private S3 | File đáp án chỉ Worker nội bộ mới đọc được, không expose qua bất kỳ API public nào |
| **Rate Limiting** | Redis TTL | Giới hạn khoảng cách giữa 2 lần nộp (VD: 10 phút/lần), áp dụng cho cả đội |
| **Logging** | Python `logging` | Tuyệt đối không dùng `print()`, log `execution_time_ms` để phát hiện Worker treo hoặc metric.py lặp vô hạn |

---

## 🌿 Quy tắc Git & Đóng góp

### Quy tắc nhánh (Branching Strategy)

```
main                             ← Production-ready, chỉ merge qua PR đã review
├── feat/<issue-id>-<mô-tả>     ← Feature (VD: feat/issue-44-enable-google-oauth)
├── fix/<issue-id>-<mô-tả>      ← Bug fix (VD: fix/issue-50-leaderboard-sort)
└── docs/<mô-tả>                ← Documentation (VD: docs/update-readme)
```

### Quy tắc Commit Message

Format: `<type>(<scope>): <mô tả ngắn gọn bằng tiếng Anh>`

| Type | Dùng khi |
|---|---|
| `feat` | Thêm tính năng mới |
| `fix` | Sửa bug |
| `docs` | Cập nhật tài liệu |
| `refactor` | Tái cấu trúc code, không thêm/sửa tính năng |
| `test` | Thêm hoặc sửa tests |
| `chore` | Cập nhật config, dependencies |

**Ví dụ thực tế:**

```bash
feat(leaderboard): implement pessimistic locking for score update
fix(submission): reject duplicate MD5 hash with HTTP 409
docs(readme): add full setup guide and architecture diagrams
refactor(auth): extract JWT logic to security module
```

### Quy trình đóng góp

1. **Đọc tài liệu** — Bắt buộc đọc `docs/openapi.yaml`, `docs/erd.md`, `docs/System_Architecture.md` trước khi code
2. **Nhận issue** — Được assign issue trên GitHub
3. **Tạo nhánh** từ `main`: `git checkout -b feat/issue-<N>-<mô-tả>`
4. **Viết code** — Tuân thủ SOLID, Hexagonal (Backend) / MVVM (Frontend)
5. **Tạo PR** — Đặt title rõ ràng, mô tả changes, thêm `Closes #<N>` để auto-close issue
6. **Code Review** — Chờ ít nhất 1 reviewer approve trước khi merge vào `main`

### Quy tắc cứng — Không được vi phạm

> ⛔ **API mới** → Phải đặc tả trong `docs/openapi.yaml` **TRƯỚC**, sau đó mới viết code Backend  
> ⛔ **Không gọi API trong Component** → Phải đi qua `Service → ViewModel → View`  
> ⛔ **Không dùng `print()`** → Sử dụng module `logging` chuẩn của Python  
> ⛔ **Không xóa dữ liệu thật** → Dùng Soft Delete (`deleted_at`) cho `USER`, `TEAM`, `CHALLENGE`

---

## 📚 Tài liệu tham chiếu

| Tài liệu | Mô tả |
|---|---|
| [`docs/openapi.yaml`](docs/openapi.yaml) | Đặc tả toàn bộ REST API (OpenAPI 3.0) — Nguồn sự thật duy nhất cho API contract |
| [`docs/erd.md`](docs/erd.md) | Entity Relationship Diagram — Thiết kế Database đầy đủ 9 bảng |
| [`docs/System_Architecture.md`](docs/System_Architecture.md) | Kiến trúc hệ thống: Hexagonal Backend, MVVM Frontend, Worker/Sandbox Pipeline |
| [`docs/BA.md`](docs/BA.md) | Business Requirements Document — Yêu cầu nghiệp vụ đầy đủ |
| [`docs/UC.md`](docs/UC.md) | Use Case Descriptions — Luồng nghiệp vụ từng actor |
| [`.agents/AGENTS.md`](.agents/AGENTS.md) | Hướng dẫn bắt buộc cho AI Agent khi tham gia phát triển |

---

## 🙏 Đội ngũ phát triển

Dự án được xây dựng bởi sinh viên và đội ngũ kỹ thuật trường **ICTU** — Đại học Công nghệ Thông tin và Truyền thông.

---

<div align="center">

**ICTU AI JUDGE** — *Công bằng · Tự động · Bảo mật*

Made with ❤️ by Q-Tech @ ICTU

</div>

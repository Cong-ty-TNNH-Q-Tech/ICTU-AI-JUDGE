# Kiến trúc Hệ thống (System Architecture)
**Tên dự án:** Nền tảng Tổ chức và Luyện tập Olympic AI ICTU
**Ngày cập nhật:** 26/07/2026

Tài liệu này mô tả chi tiết kiến trúc tổng thể của hệ thống, bao gồm cấu trúc thư mục tiêu chuẩn cho Backend (FastAPI - Hexagonal Architecture), Frontend (React - MVVM) và các tiêu chuẩn bảo mật, xử lý chịu tải cao (High Availability).

---

## 1. Sơ đồ Kiến trúc Tổng thể (High-level Architecture)

```mermaid
flowchart TB
    Client([Trình duyệt Sinh viên / Admin])
    
    subgraph Frontend [Frontend: React (MVVM)]
        View[Views - Giao diện]
        VM[ViewModels - Custom Hooks]
        Store[(Zustand - Global Model)]
        Model[Models & API Services]
        
        View <-->|Data binding| VM
        VM <-->|Subscribe| Store
        VM <-->|Fetch/Mutate| Model
    end

    subgraph Backend [Backend: FastAPI (Hexagonal Architecture)]
        direction TB
        Entry[Entrypoints: FastAPI Routers]
        App[Application: Use Cases & Ports]
        Dom[Domain: Entities & Rules]
        Adapt[Adapters: DB, S3, Celery]
        
        Entry --> App
        App --> Dom
        App --> Adapt
    end

    subgraph Infrastructure [Cơ sở hạ tầng]
        DB[(PostgreSQL)]
        Redis[(Redis Queue)]
        Celery[Celery Workers]
        Docker[Docker Sandbox]
        S3[(S3/Server Storage)]
    end

    Client <-->|HTTP/REST w/ HttpOnly Cookies| View
    Model <-->|REST API| Entry
    Adapt <-->|SQLAlchemy (Pessimistic Locking)| DB
    Adapt <-->|Pub/Sub| Redis
    Redis <-->|Job Queue| Celery
    Celery <-->|Đọc file CSV| S3
    Adapt <-->|Upload file| S3
    Celery -. Sinh ra Container ảo .-> Docker
```

---

## 2. Thiết kế Backend (FastAPI - Hexagonal Architecture)

Dựa trên cấu trúc chuẩn, Backend áp dụng Kiến trúc Lục giác (Ports and Adapters) để cô lập logic nghiệp vụ (Domain) khỏi Database và Framework.

### 2.1. Cấu trúc thư mục (`backend/app/`)

```text
backend/app/
├── core/                   # Cấu hình cốt lõi (Config, Dependency Injection)
│   └── security/           # [BẢO MẬT] Xử lý JWT. Yêu cầu bắt buộc: Trả về Token qua HttpOnly Cookies (Chống XSS).
├── domain/                 # Thực thể (Entities) và logic nghiệp vụ
│   ├── entities/           
│   ├── exceptions/         
│   └── value_objects/      
├── application/            # Điều phối logic nghiệp vụ (Use Cases)
│   ├── use_cases/          
│   ├── interfaces/         # Cổng ra (Outbound Ports)
│   └── dtos/               
├── adapters/               # Tương tác hệ thống ngoài (Outbound Adapters)
│   ├── database/           # [CHỐNG RACE CONDITION] Setup Pessimistic Locking (SELECT FOR UPDATE) tại Repository.
│   ├── storage/            
│   └── worker/             
└── entrypoints/            # Điểm tiếp nhận request (Inbound Adapters)
    ├── api/                
    └── dependencies.py     
```

### 2.2. Luồng dữ liệu (Data Flow) ví dụ: "Nộp bài dự thi"
1. **Entrypoint**: FastAPI nhận HTTP POST với file CSV. Middleware kiểm tra JWT từ HttpOnly Cookie.
2. **Application**: Use Case `SubmitPredictionUseCase` băm MD5 file kiểm tra trùng lặp.
3. **Domain**: Kiểm tra hạn nộp, giới hạn Rate Limit.
4. **Adapter (Storage)**: Lưu file CSV của sinh viên lên S3.
5. **Adapter (Worker)**: Đẩy Job ID vào Redis.
6. **Adapter (Database)**: Lưu `SUBMISSION` (status: PENDING) vào PostgreSQL.

---

## 3. Thiết kế Frontend (React - Model-View-ViewModel)

Áp dụng Custom Hooks làm ViewModel, tách bạch hoàn toàn logic gọi API ra khỏi View. Sử dụng Zustand làm Global Model.

### 3.1. Cấu trúc thư mục (`frontend/src/`)

```text
frontend/src/
├── assets/                 
├── core/                   # Cấu hình Axios (Tự động gửi thông tin credentials/cookies)
├── models/                 # Định nghĩa Type/Interface (TypeScript)
├── services/               # Lớp gọi API (REST/Axios)
├── store/                  # [GLOBAL MODEL] Zustand store (Quản lý Auth, Theme, Global State)
├── viewmodels/             # Custom Hooks (Kết nối View, Store và Service)
│   ├── useChallengeVM.ts   
│   └── useAuthVM.ts        # Lắng nghe (Subscribe) dữ liệu từ store/
├── views/                  # Giao diện hiển thị (Chỉ chứa UI & TailwindCSS)
│   ├── components/         
│   ├── layouts/            
│   └── pages/              
└── App.tsx                 
```

---

## 4. Kiến trúc Background Worker & Chấm điểm (Scoring)

Việc chấm điểm (Scoring) có rủi ro cực cao về bảo mật và toàn vẹn dữ liệu. Hệ thống vận hành theo kiến trúc an toàn tuyệt đối như sau:

1. **Consumer (Celery Worker):** Lấy Job từ Redis, tải `Ground Truth` và `Submission CSV` từ S3.
2. **[BẢO MẬT RCE] Docker Sandbox:** 
   - Thay vì `import metric.py` trực tiếp vào Worker (có nguy cơ dính mã độc do Admin up nhầm/bị hack hoặc vòng lặp vô hạn).
   - Celery Worker sẽ gọi Docker API để **spin up (khởi tạo) một Container dùng 1 lần** (bị giới hạn RAM/CPU và chặn truy cập mạng).
   - Truyền 2 file CSV vào Container. Container chạy script Python, nhả kết quả điểm (Float) ra `stdout` rồi **tự hủy**.
3. **[CHỐNG GHI ĐÈ] Cập nhật Leaderboard:**
   - Worker nhận điểm từ Sandbox và tiến hành lưu DB.
   - Khi Update bảng `LEADERBOARD`, Repository bắt buộc dùng cơ chế **Pessimistic Locking** (`SELECT ... FOR UPDATE` của PostgreSQL) để khóa (lock) row của Đội thi đó.
   - Tránh hiện tượng 3 thành viên nộp bài cùng lúc, 3 Worker chấm xong cùng lúc ghi đè làm sai lệch thứ hạng (Race Condition).

---

## 5. Tổng kết Công nghệ (Tech Stack)
- **Frontend:** React, TypeScript, TailwindCSS, **Zustand (Global Model)**.
- **Backend:** Python, FastAPI, SQLAlchemy (ORM), Pydantic.
- **Database:** PostgreSQL.
- **Message Broker:** Redis.
- **Background Jobs & Security:** Celery + **Docker (Sandbox)**.
- **Bảo mật API:** JWT đính kèm qua **HttpOnly Cookies** (Chống XSS).
- **Storage:** S3 Compatible (MinIO) / Local file system.

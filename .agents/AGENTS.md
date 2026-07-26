# ICTU AI JUDGE — Hệ Thống Hướng Dẫn Dành Cho AI Agent (Agent Instructions)

Tài liệu này cung cấp bộ quy chuẩn (Guidelines) bắt buộc dành cho mọi lập trình viên và AI Agent (như Claude, GPT, Gemini) khi tham gia phát triển mã nguồn của nền tảng thi đấu **ICTU AI JUDGE**.

## 1. Tổng quan dự án (Project Overview)
**ICTU AI JUDGE** là một nền tảng chuyên tổ chức thi đấu và đánh giá mô hình Trí tuệ Nhân tạo (AI Challenge Platform) dành cho sinh viên trường ICTU, hoạt động theo mô hình đánh giá chấm điểm tự động (Kaggle-like).

- **Frontend:** React + Vite + TypeScript (Kiến trúc MVVM kết hợp Zustand)
- **Backend:** FastAPI (Python) + SQLAlchemy (Kiến trúc Hexagonal)
- **Kiến trúc Background:** Celery Workers + Redis Message Broker + Docker Sandbox
- **Database:** PostgreSQL (Có Pessimistic Locking)
- **Tài liệu tham chiếu:** Mọi Agent **BẮT BUỘC** phải đọc và tuân thủ `docs/openapi.yaml`, `docs/erd.md`, và `docs/System_Architecture.md` trước khi sinh code.

---

## 2. Nguyên tắc chung (General Guidelines)
- Luôn giữ tâm thế **High Availability & Concurrency**: Hệ thống phải chịu tải hàng trăm lượt submit cùng một giây vào sát giờ deadline.
- **Security-First**: Tuyệt đối không được chạy trực tiếp code Python lạ (Custom Metric) trên server. Bắt buộc dùng môi trường Sandbox (Docker). Toàn bộ JWT Token phải lưu trong HttpOnly Cookie để chống XSS.
- **Logging Standards**: Tuyệt đối KHÔNG sử dụng `print()`. Sử dụng thư viện `logging` chuẩn. Log lại thời gian chấm bài (`execution_time_ms`) để phát hiện worker treo.
- **Anti-Spam**: Mọi thao tác nộp bài (Submit) phải qua bước hash MD5 file đính kèm để loại bỏ các file trùng lặp, tránh lãng phí tài nguyên máy chủ và worker.

---

## 3. Quy chuẩn Backend (FastAPI + Hexagonal Architecture)

Dự án tuân thủ mô hình **Hexagonal Architecture** (Ports & Adapters).
- **Core Domain:** Không được phép chứa bất kỳ logic nào liên quan đến Framework (FastAPI) hay Database (SQLAlchemy). Nó chỉ chứa logic nghiệp vụ thuần túy (VD: Check hạn nộp, Check Rate Limit).
- **Inbound/Entrypoints:** Router FastAPI. Nhận HTTP Request, gọi Use Case và trả về response.
- **Outbound/Adapters:** Giao tiếp với PostgreSQL, S3, Redis, Celery.
- **Dependency Injection (DI):** Sử dụng `Depends` của FastAPI để inject Outbound Repository vào Use Case.

### 3.1. Xử lý Chấm điểm ngầm (Background Scoring Rules)
- **Scoring Pipeline:** Việc chấm điểm bài thi (`.csv`) là tác vụ ngốn CPU, bắt buộc phải đẩy vào Queue qua Celery/Redis. Router API chỉ trả về `HTTP 201 (PENDING)` ngay lập tức.
- **Docker Sandbox:** Celery Worker KHÔNG được gọi trực tiếp `import metric.py`. Phải dùng Docker API gọi lên 1 Container dùng 1 lần (Isolated Sandbox) để tính toán điểm số.
- **Race Condition & Locking:** Khi Worker cập nhật điểm kỷ lục lên Bảng xếp hạng (`LEADERBOARD`), BẮT BUỘC dùng lệnh `SELECT ... FOR UPDATE` (Pessimistic Locking) ở tầng Database Adapter để ngăn chặn ghi đè sai thứ hạng.

---

## 4. Quy chuẩn Frontend (React + Vite + TypeScript)

- **UI/UX Core:** Sử dụng **Tailwind CSS** làm cốt lõi. Giao diện ưu tiên vẻ đẹp hiện đại, tốc độ phản hồi cực nhanh (Single Page App).
- **Mô hình MVVM:** 
  - **Model & Service:** Nơi chứa Types (dựa trên OpenAPI) và thư viện gọi API (Axios).
  - **Global Store (Zustand):** Đóng vai trò là Global Model để lưu trữ thông tin User Auth và Theme.
  - **ViewModel:** Sử dụng Custom Hooks (VD: `useChallengeVM`, `useLeaderboardVM`) để fetch dữ liệu, xử lý format, pagination và expose cho View. Tuyệt đối không gọi API trực tiếp trong UI Component.
  - **View:** Component giao diện câm (Dumb Components), chỉ nhận dữ liệu từ ViewModel để render UI.

---

## 5. Luật Thi Đấu & Giới Hạn (Rules & Limits)
- **Nguyên tắc "Team of 1":** Mọi sinh viên tham gia thi đấu đều được hệ thống tự động bọc trong 1 `TEAM` (cá nhân là đội 1 người). Toàn bộ Logic Query và Xếp hạng hoạt động dựa trên `team_id`, bỏ qua `user_id`.
- **Anti-Overfitting:** Bảng xếp hạng Private không tự động lấy điểm Public cao nhất. Sinh viên phải chủ động tick chọn bài tốt nhất (`is_selected_for_private`) trước giờ deadline. Nếu sinh viên quên, hệ thống mới dùng điểm Public tốt nhất làm dự phòng (Fallback).
- **Giới hạn tỷ lệ nộp (Rate Limit):** Hệ thống không giới hạn số lượt nộp trong ngày (Unlimited Daily), nhưng BẮT BUỘC phải áp dụng khoảng cách thời gian giữa 2 lần nộp (Rate limit, ví dụ 10 phút/lần). Lượt nộp bị lỗi format không bị trừ vào quota.

---

## 6. Git & Development Workflow

1. **Quy tắc thiết kế API:** Mọi API mới phải được đặc tả RESTful vào `docs/openapi.yaml` **TRƯỚC**, sau đó mới tiến hành viết code Backend.
2. **Quy tắc định dạng Git Commit:** `<type>(<scope>): <description>` (Ví dụ: `feat(leaderboard): implement pessimistic locking for score update`).
3. **Mọi dữ liệu nhạy cảm (Core Data):** Các bảng như `USER`, `CHALLENGE`, `TEAM` bắt buộc phải triển khai cơ chế **Soft Delete** (`deleted_at`). Không dùng lệnh `DELETE` thẳng vào CSDL.

---

## 7. Tiêu Chuẩn Viết Code (SOLID & Design Patterns)

Tất cả AI Agents và lập trình viên phải nghiêm ngặt tuân thủ:

### Tuân thủ 5 Nguyên tắc SOLID
- **S (Single Responsibility):** Một Class/Function chỉ đảm nhiệm một việc. Tách logic state ra Custom Hook, Component chỉ để render UI.
- **O (Open/Closed):** Dễ mở rộng nhưng KHÔNG sửa code cũ. Nếu thêm hàm chấm điểm mới, hãy mở rộng interface thay vì if/else.
- **D (Dependency Inversion):** Module cấp cao không phụ thuộc cấp thấp, cả 2 phụ thuộc Interface/Abstraction. Tầng Use Case chỉ giao tiếp với Repository qua Interface.

### Các Design Patterns Khuyến nghị
- **Repository Pattern:** Bắt buộc dùng ở tầng Backend Data Layer để giao tiếp với CSDL.
- **Strategy Pattern:** Sử dụng để chuyển đổi linh hoạt các thuật toán chấm điểm (Ví dụ: Chuyển đổi chiến lược tính `AccuracyScore` và `RMSEScore` hoặc `CustomMetric`).
- **Factory Pattern:** Sử dụng để khởi tạo Client giao tiếp với Storage (Ví dụ: S3 hoặc LocalDisk) hoặc khởi tạo Sandbox Docker.

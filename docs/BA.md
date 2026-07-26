# Tài liệu Phân tích Nghiệp vụ (Business Requirements Document - BRD)
**Tên dự án:** Nền tảng Tổ chức và Luyện tập Olympic AI ICTU (ICTU AI Challenge Platform)
**Ngày cập nhật:** 26/07/2026

---

## 1. Tổng quan dự án (Project Overview)
**Mục tiêu:** Xây dựng một nền tảng thi đấu và thực hành các bài toán Trí tuệ Nhân tạo (AI) / Học máy (Machine Learning) dành riêng cho sinh viên trường Đại học Công nghệ Thông tin và Truyền thông (ICTU). Hệ thống phục vụ hai mục đích chính:
1. Cung cấp môi trường luyện tập tự do (Public Challenges) cho sinh viên ICTU tự trau dồi kỹ năng.
2. Tổ chức các cuộc thi chính thức (Competitions), ví dụ như thi Olympic AI cấp trường ICTU, với quyền truy cập được kiểm soát chặt chẽ.

**Đối tượng sử dụng (Actors):**
- **User (Thí sinh/Sinh viên):** Người tham gia giải các bài toán AI, nộp kết quả (submit) và theo dõi thứ hạng. Có thể thi cá nhân hoặc theo đội.
- **Admin (Quản trị viên/Ban tổ chức):** Người quản lý hệ thống, tạo bài thi, cấu hình luật thi, metrics chấm điểm và quản lý người dùng.

---

## 2. Yêu cầu chức năng (Functional Requirements)

### 2.1. Phân quyền và Xác thực (Authentication & Authorization)
- **User thường (Thí sinh):**
  - Đăng ký tài khoản mới (Sign up). **Yêu cầu bắt buộc:** Sử dụng email có đuôi `@ictu.edu.vn` (thông qua Google OAuth) hoặc xác thực bằng Mã sinh viên. Việc này giúp đảm bảo chỉ sinh viên ICTU được tham gia và ngăn chặn gian lận tạo nhiều tài khoản ảo (clone) để lách luật nộp bài.
  - Đăng nhập (Sign in).
  - Khôi phục mật khẩu / Quên mật khẩu (Forgot Password).
- **Admin:**
  - Được cấp tài khoản từ hệ thống, là tài khoản quản trị duy nhất có quyền cấu hình hệ thống.
  - Có quyền truy cập vào trang Quản trị (Admin Panel).

### 2.2. Quản lý Bài toán & Cuộc thi (Challenges & Competitions)
Hệ thống chia làm 2 nhóm bài chính:
1. **Public Challenges (Luyện tập):** 
   - Hiển thị công khai trên trang chủ/danh sách bài tập.
   - User thường có thể tự do xem và nhấn "Ghi danh" (Enroll) để tham gia giải bài.
2. **Competitions (Thi đấu chính thức):**
   - Không cho phép user tự do ghi danh.
   - Admin trực tiếp chỉ định/thêm danh sách user (hoặc import từ file Excel) có quyền tham gia.
   - Chỉ những user được cấp quyền mới nhìn thấy và truy cập được vào cuộc thi này.

### 2.3. Cấu trúc của một Bài toán (Challenge Structure)
Mỗi bài (dù là Public hay Competition) đều bao gồm các thành phần sau:
- **Thông tin chung:** Tiêu đề, Mô tả bài toán (Mục tiêu, bối cảnh).
- **Dữ liệu (Dataset):** Mô tả cấu trúc dữ liệu, đính kèm link tải dataset (vd: Link Google Drive hoặc tải trực tiếp). Yêu cầu có thêm **file mẫu (`sample_submission.csv`)** để thí sinh biết cấu trúc cột (ID, Prediction) trước khi nộp.
- **Thảo luận (Discussion):** Khu vực để thí sinh hỏi đáp, báo lỗi dataset và Admin vào giải đáp.
- **Luật chơi & Giới hạn thời gian (Rules & Timeline):**
  - Thời gian mở bài (Start Time) và Thời gian đóng bài (End Time). Ngoài thời gian này, hệ thống không nhận submit.
- **Hệ thống chấm điểm (Evaluation/Metrics):**
  - Admin đưa ra khung metrics để chấm điểm (ví dụ: Accuracy, F1-Score, RMSE). Ngoài ra, hỗ trợ **Custom Metric** bằng cách cho phép Admin tải lên một script Python (`metric.py`) để hệ thống chấm điểm cho các bài toán đặc thù.
  - File kết quả chuẩn (Ground Truth): Admin upload lên, bắt buộc phải có **cột `Usage` (chứa nhãn `Public`, `Private`)**. Worker khi chấm điểm sẽ dựa vào cột này để phân định dòng nào tính cho Public Leaderboard, dòng nào tính cho Private Leaderboard (chống Data Leakage, đảm bảo phân phối test chuẩn).
- **Cơ chế Nộp bài (Submission Type):**
  - Hệ thống chỉ yêu cầu nộp **file kết quả (vd: .csv, .json)**, thí sinh tự chạy model trên máy cá nhân/Google Colab. Không chạy trực tiếp model trên server web để tiết kiệm chi phí phần cứng.
- **Giới hạn nộp bài (Submission Limits):**
  - Giới hạn số lần nộp bài tối đa trong 1 ngày (Daily limit).
  - Giới hạn khoảng thời gian giữa 2 lần nộp (Rate limit - ví dụ: 10 phút sau lần submit trước mới được nộp tiếp). Nếu là đội thi, giới hạn này áp dụng chung cho cả đội.
  - **Giới hạn dung lượng file:** Admin thiết lập kích thước tối đa cho file upload (ví dụ max 50MB) để ngăn chặn việc spam file lớn gây quá tải máy chủ.
- **Bảng xếp hạng (Leaderboard):**
  - **Public Leaderboard:** Hiển thị điểm số dựa trên dữ liệu đánh dấu `Public` trong suốt quá trình thi.
  - **Private Leaderboard:** Chỉ hiển thị và tính điểm sau khi cuộc thi kết thúc dựa trên dữ liệu đánh dấu `Private`. Đây là kết quả chung cuộc.
  - **Xử lý đồng hạng (Tie-breaking):** Trong trường hợp 2 cá nhân/đội có cùng điểm số, ưu tiên người/đội có **Thời gian nộp bài (Submission Time) sớm hơn** sẽ xếp hạng cao hơn.

### 2.4. Tính năng thi theo Đội (Team Formation)
- Sinh viên có thể tạo Đội (Team), đặt tên đội và mời các thành viên khác tham gia qua email hoặc username.
- Nhóm trưởng quản lý duyệt/xóa thành viên.
- **Khóa đội (Team Locking) & Rời nhóm:**
  - Thành viên **không được phép rời nhóm** nếu nhóm đó đã có bất kỳ lịch sử nộp bài (submit) nào để tránh việc mang code sang nhóm khác.
  - Admin có thể thiết lập **Deadline gộp nhóm/khóa đội** (ví dụ: 3 ngày trước khi cuộc thi kết thúc). Qua thời gian này, các team không được thêm/xóa thành viên hay gộp với team khác.
- Mọi thao tác nộp bài của bất kỳ thành viên nào đều tính cho đội (chia sẻ giới hạn lượt nộp chung).

### 2.5. Tính năng dành cho User
- Xem danh sách các Public Challenges và Competitions (được phép tham gia).
- Xem chi tiết đề bài, tải dataset và tham gia thảo luận (Q&A).
- Nộp bài (Submit): 
  - Upload file kết quả định dạng `.csv` hoặc `.json`.
  - Hệ thống kiểm tra hợp lệ của file (đối chiếu cấu trúc cột với `sample_submission.csv`, kiểm tra dung lượng).
- **Nộp Source Code (Chống gian lận):** 
  - Tính năng mở vào cuối cuộc thi, yêu cầu các team đạt giải nộp lại Jupyter Notebook / Script Python.
  - **Bắt buộc:** Phải đính kèm file `requirements.txt` (hoặc `Dockerfile`) mô tả rõ version các thư viện sử dụng để BTC có môi trường chạy lại kiểm chứng (reproduce) chính xác.
- Xem lịch sử nộp bài (Submission History) và kết quả của từng lần nộp.
- Theo dõi Bảng xếp hạng (Leaderboard) theo thời gian thực.

### 2.6. Tính năng dành cho Admin
- **Quản lý User & Teams:** 
  - Xem danh sách, tạo mới, khóa/mở khóa tài khoản cá nhân hoặc đội thi.
  - Reset mật khẩu cho user.
- **Quản lý Bài thi:**
  - Tạo/Sửa/Xóa Public Challenges và Competitions.
  - Soạn thảo đề bài (Hỗ trợ Markdown/Rich Text).
  - Cấu hình Metrics chấm điểm (Standard hoặc Custom script), upload file Ground Truth có chứa nhãn `Usage`.
  - Cấu hình thời gian, số lần submit, dung lượng file tối đa, thời gian khóa đội.
- **Quản lý quyền thi đấu:** Gán user hoặc team vào các Competitions cụ thể.
- **Quản lý Submit & Chống gian lận:** 
  - Xem được toàn bộ lịch sử nộp bài của các thí sinh/đội.
  - Tải file nộp `.csv` và tải Source Code của thí sinh về để hội đồng thẩm định kết quả, đối soát gian lận.

---

## 3. Yêu cầu phi chức năng (Non-Functional Requirements)

- **Hiệu năng & Khả năng mở rộng (Performance & Scalability):**
  - Khả năng chịu tải tốt trong thời gian diễn ra Competition (khi lượng sinh viên truy cập và nộp bài cùng lúc tăng đột biến).
  - Worker xử lý chấm điểm (Scoring Worker) cần chạy bất đồng bộ (Asynchronous/Background jobs - vd: Celery/Redis) để không làm nghẽn server web.
- **Quản trị Tài nguyên & Tối ưu Lưu trữ (Storage Retention):**
  - Để tránh quá tải ổ cứng do sinh viên nộp bài liên tục, hệ thống sẽ tự động dọn dẹp (auto-clean) các file submit `.csv`.
  - Chỉ **lưu trữ vật lý file kết quả có điểm cao nhất** và **file nộp gần đây nhất** của mỗi người/đội. Các file cũ hơn sẽ bị xóa đi (hệ thống chỉ lưu lại dòng lịch sử điểm số trong Database).
- **Trải nghiệm người dùng (UI/UX):**
  - Giao diện hiện đại, chuyên nghiệp (mang hơi hướng các trang như Kaggle, AI Challenge PTIT).
  - Hỗ trợ responsive (hiển thị tốt trên cả PC và Mobile).
  - Hiển thị công thức toán học tốt (hỗ trợ MathJax/KaTeX trong mô tả đề bài).
- **Bảo mật (Security):**
  - File Ground Truth của Admin phải được bảo mật tuyệt đối, không được expose ra public API.
  - Validate chặt chẽ file upload từ user để tránh các lỗ hổng tải file mã độc (kiểm tra phần mở rộng, dung lượng).
  - Ngăn chặn các hành vi submit liên tục (DDoS/Spam) bằng Rate Limiting.

---

## 4. Mô hình luồng nghiệp vụ cơ bản (Workflow)

### Luồng 1: Tổ chức cuộc thi (Admin)
1. Admin tạo Competition -> Nhập Mô tả, Thời gian, Dataset Link.
2. Admin cấu hình Metric (chuẩn hoặc tải lên `metric.py`) -> Upload file mẫu `sample_submission.csv` và file `Ground Truth` (có cột phân định `Usage`).
3. Admin thiết lập rules: max 5 submits/ngày, rate limit 10 phút, giới hạn file size 50MB, deadline khóa đội.
4. Admin import danh sách user/team được phép tham gia vào Competition.

### Luồng 2: Thí sinh tham gia thi (User)
1. Sinh viên đăng nhập (xác thực email ICTU) -> Tạo nhóm hoặc thi cá nhân -> Vào mục Competitions.
2. Thấy cuộc thi đang mở -> Tải Dataset về làm model ở máy cá nhân hoặc Google Colab.
3. Chạy model ra file kết quả theo format mẫu (vd: `submission.csv`).
4. Lên web upload file `submission.csv` -> Nhấn Submit.
5. Hệ thống tiếp nhận, xác thực dung lượng/định dạng, Worker chấm điểm nền -> Trả về kết quả (Score) -> Cập nhật Public Leaderboard.
6. Hệ thống chạy ngầm Cronjob xóa bớt file rác, chỉ giữ lại file CSV điểm cao nhất của nhóm.
7. (Khi kết thúc cuộc thi): Top các đội dẫn đầu nộp lại Source Code (kèm `requirements.txt`) để BTC đối chiếu. Bảng xếp hạng Private Leaderboard được công bố, xác định người thắng cuộc bằng luật Tie-break nếu bằng điểm.

---

## 5. Đề xuất Công nghệ (Tech Stack Suggestion)
- **Frontend:** React.js / Next.js hoặc Vue.js (Đảm bảo tính tương tác cao và giao diện đẹp).
- **Backend:** Python (FastAPI / Django) hoặc Node.js. 
  - *Lưu ý:* Backend bằng Python sẽ rất tiện lợi cho việc tích hợp các thư viện Data Science (như `pandas`, `scikit-learn`) để tính toán Metrics chấm điểm và chạy các Custom Metrics linh hoạt.
- **Database:** PostgreSQL (Lưu trữ dữ liệu user, thông tin cuộc thi, team) + Redis (Lưu trữ cache, rate limit và background jobs queue).
- **Task Queue:** Celery + Redis (Đảm nhiệm việc chấm điểm bất đồng bộ).
- **Storage:** AWS S3, MinIO hoặc Google Drive API để lưu trữ Dataset, File submissions và Source code.

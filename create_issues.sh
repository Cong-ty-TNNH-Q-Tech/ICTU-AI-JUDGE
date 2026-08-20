#!/bin/bash

# Function to create an issue
create_issue() {
  title="$1"
  body="$2"
  
  echo "Creating issue: $title"
  gh issue create --title "$title" --body "$body" --label "enhancement" || gh issue create --title "$title" --body "$body"
}

# Issue 1
read -r -d '' BODY1 << 'BODY'
**Người phụ trách đề xuất:** Hà
**Loại:** Fullstack

**Mô tả:**
Hiện tại hệ thống chỉ hỗ trợ đăng nhập qua Google. Cần bổ sung luồng đăng ký tài khoản mới và đăng nhập bằng Username/Password truyền thống.

**Task backend:**
- [ ] Cập nhật Database Schema nếu cần thiết (lưu hashed password).
- [ ] Viết API Đăng ký tài khoản (Register) với mã hóa `bcrypt`.
- [ ] Viết API Đăng nhập (Login) cấp JWT Token.

**Task frontend:**
- [ ] Thiết kế UI Form Đăng ký.
- [ ] Thiết kế UI Form Đăng nhập.
- [ ] Tích hợp API và lưu trạng thái đăng nhập vào store (Zustand).
BODY
create_issue "[Feature] Đăng ký & Đăng nhập bằng Username/Password" "$BODY1"

# Issue 2
read -r -d '' BODY2 << 'BODY'
**Người phụ trách đề xuất:** Hà
**Loại:** Fullstack

**Mô tả:**
Bổ sung luồng đổi mật khẩu cho user đang đăng nhập và luồng quên mật khẩu/reset mật khẩu qua Email (Yêu cầu cấu hình SMTP).

**Task backend:**
- [ ] Cấu hình hệ thống gửi mail SMTP (vd: Gmail, SendGrid) qua `.env`.
- [ ] Viết API Đổi mật khẩu (cần mật khẩu cũ).
- [ ] Viết API Quên mật khẩu (Gửi mã OTP hoặc Token reset qua email).
- [ ] Viết API Đặt lại mật khẩu (Verify OTP/Token và lưu mật khẩu mới).

**Task frontend:**
- [ ] UI Form Đổi mật khẩu (trong trang Profile).
- [ ] UI Form Quên mật khẩu (nhập email).
- [ ] UI Form Đặt lại mật khẩu (nhập mã xác nhận + pass mới).
BODY
create_issue "[Feature] Đổi mật khẩu & Quên mật khẩu (Reset Password)" "$BODY2"

# Issue 3
read -r -d '' BODY3 << 'BODY'
**Người phụ trách đề xuất:** Hà
**Loại:** Fullstack

**Mô tả:**
Tính năng dành cho Admin để quản lý danh sách sinh viên. Cho phép tạo tài khoản thủ công hoặc tải lên hàng loạt từ file `.csv`.

**Task backend:**
- [ ] Viết API CRUD quản lý User dành cho Admin.
- [ ] Viết API nhận file `.csv`, parse dữ liệu, hash mật khẩu mặc định và lưu vào Database.

**Task frontend:**
- [ ] Giao diện Admin: Bảng danh sách User (Paging, Search).
- [ ] Form thêm/sửa User.
- [ ] Giao diện Modal Upload file `.csv` và hiển thị kết quả import.
BODY
create_issue "[Feature] Admin Quản lý User & Import CSV" "$BODY3"

# Issue 4
read -r -d '' BODY4 << 'BODY'
**Người phụ trách đề xuất:** Thịnh
**Loại:** Core / Sandbox / Docs

**Mô tả:**
Để hỗ trợ đa dạng bài toán (vd: Sinh ảnh, Xử lý ngôn ngữ tự nhiên), Sandbox cần khả năng nhận/xử lý file `.zip`. Đồng thời cần tài liệu/mẫu code cho các custom metric phổ biến.

**Task Core/Sandbox:**
- [ ] Cấu hình Backend & Docker Sandbox hỗ trợ nộp, tải và giải nén file `.zip` tự động (cho cả Ground Truth và Submission).
- [ ] Kiểm thử việc so sánh 2 thư mục sau khi giải nén bằng Python script.

**Task Docs/Metric:**
- [ ] Soạn tài liệu hướng dẫn viết Custom Metric (`.md`).
- [ ] Viết file Template code Python mẫu cho các metric: `PSNR`, `SSIM`, `BLEU`.
- [ ] Viết file Template code cho metric tính `Precision/Recall/F1` xử lý mất cân bằng dữ liệu.
BODY
create_issue "[Feature] Sandbox xử lý file Zip & Tài liệu Custom Metric" "$BODY4"

# Issue 5
read -r -d '' BODY5 << 'BODY'
**Người phụ trách đề xuất:** Hoàng
**Loại:** Fullstack

**Mô tả:**
Cho phép tạo một Cuộc thi (Contest) lớn bao gồm nhiều vòng thi/đề bài nhỏ (Challenges) bên trong.

**Task backend:**
- [ ] Thiết kế Database Schema: Tạo bảng `Contest`, thêm khóa ngoại `contest_id` vào bảng `Challenge` (Quan hệ 1-N).
- [ ] Viết API CRUD cho Contest (Dành cho Admin).
- [ ] API lấy danh sách Contest và chi tiết Contest (Dành cho User).

**Task frontend:**
- [ ] UI Giao diện danh sách các Cuộc thi.
- [ ] UI Trang chi tiết Cuộc thi (Liệt kê các Challenge con bên trong).
- [ ] Giao diện Admin quản lý Contest.
BODY
create_issue "[Feature] Xây dựng hệ thống Cuộc thi (Contest Entity)" "$BODY5"

# Issue 6
read -r -d '' BODY6 << 'BODY'
**Người phụ trách đề xuất:** Thịnh
**Loại:** Thuật toán / Fullstack

**Mô tả:**
Tính toán và hiển thị bảng xếp hạng chung cuộc cho một Cuộc thi dựa trên điểm số của các Challenge con.

**Task backend:**
- [ ] Viết Use-case/Logic tính toán điểm tổng: Query điểm từ các bài Challenge con của 1 team, áp dụng công thức/trọng số (nếu có).
- [ ] Viết API trả về dữ liệu Leaderboard tổng hợp cho Contest.

**Task frontend:**
- [ ] Thiết kế UI hiển thị Bảng xếp hạng chung cuộc cho Contest ở màn hình chi tiết Contest.
BODY
create_issue "[Feature] Bảng xếp hạng Contest Leaderboard (Ranking tổng)" "$BODY6"

# Issue 7
read -r -d '' BODY7 << 'BODY'
**Người phụ trách đề xuất:** Hoàng
**Loại:** Fullstack

**Mô tả:**
Ngăn chặn gian lận bằng cách khóa mục "Giải pháp" (không cho đọc/đăng lời giải) trong khi kỳ thi đang diễn ra. Chỉ mở sau khi kết thúc deadline.

**Task backend:**
- [ ] Logic kiểm tra thời gian hiện tại vs thời gian của Challenge/Contest, trả về cờ `is_locked = true/false` trong các API liên quan đến giải pháp.

**Task frontend:**
- [ ] Xử lý UI: Nếu `is_locked = true` thì hiển thị icon ổ khóa, vô hiệu hóa (disable) nút Tạo giải pháp và che mờ/khóa danh sách giải pháp.
- [ ] Hiển thị cảnh báo giải thích rõ khi nào mục Giải pháp được mở lại.
BODY
create_issue "[Feature] Phân quyền mục Giải pháp (Solution Visibility)" "$BODY7"

echo "Done!"

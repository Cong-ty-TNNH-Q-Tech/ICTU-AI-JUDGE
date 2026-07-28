# 🔢 Digit Recognizer: Nhận Dạng Chữ Số Viết Tay

## 📖 Bối cảnh (Context)
Thị giác máy tính (Computer Vision) là một trong những lĩnh vực phát triển nhanh nhất của Trí tuệ Nhân tạo. Tuy nhiên, trước khi giải quyết các bài toán phức tạp như nhận diện khuôn mặt hay xe tự lái, chúng ta cần bắt đầu với những bài toán nền tảng nhất: nhận dạng các ký tự.

## 🎯 Nhiệm vụ của bạn
Bài toán yêu cầu bạn xây dựng một mô hình Machine Learning có khả năng phân loại chính xác một hình ảnh chứa một chữ số viết tay (từ `0` đến `9`). Dữ liệu đã được tiền xử lý và chuyển đổi từ hình ảnh pixel thành các mảng dữ liệu số để thân thiện hơn với các bạn mới học Data Science.

## 📊 Dữ liệu (Dataset)
Bộ dữ liệu là phiên bản thu gọn của thư viện MNIST kinh điển. Mỗi hàng trong tập dữ liệu đại diện cho một hình ảnh của một chữ số viết tay.
Hình ảnh gốc có kích thước 8x8 pixel, do đó chúng ta có 64 thuộc tính (pixel_0_0 đến pixel_7_7). Mỗi thuộc tính có giá trị từ 0 đến 16, thể hiện độ đậm nhạt của điểm ảnh đó.

- `train.csv`: Tập dữ liệu dùng để huấn luyện mô hình (bao gồm 64 cột pixel và 1 cột `Label` cho biết đó là số mấy).
- `test.csv`: Tập dữ liệu kiểm thử. Bạn cần dự đoán chữ số cho các dòng trong tập này.

## 🏆 Đánh giá (Evaluation)
Chất lượng của mô hình được đánh giá dựa trên **Accuracy Score** (Độ chính xác).
Mọi dự đoán của bạn sẽ được so sánh với nhãn thực tế (Ground Truth) để tính toán số lượng ảnh được phân loại đúng.

## 📤 Hướng dẫn nộp bài (Submission)
File nộp bài phải ở định dạng `.csv` có chứa đúng 2 cột:
- `ImageId`: ID của hình ảnh trong tập test.
- `Label`: Chữ số bạn dự đoán (từ 0 đến 9).

Hãy xem file `sample_submission.csv` để đối chiếu format nộp bài chuẩn nhé!

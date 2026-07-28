# 💬 Vietnamese Sentiment Analysis: Thấu Hiểu Lời Nói Tiếng Việt

## 📖 Bối cảnh (Context)
Xử lý ngôn ngữ tự nhiên (NLP) là một mảng cực kỳ thiết thực trong thời đại chuyển đổi số. Từ việc phân tích bình luận của khách hàng trên các sàn TMĐT cho đến nhận diện phản hồi của sinh viên về môn học, AI giúp con người tự động hóa việc đọc và phân tích hàng triệu văn bản mỗi ngày, từ đó đưa ra các quyết định kinh doanh hoặc nâng cao chất lượng dịch vụ.

## 🎯 Nhiệm vụ của bạn
Bạn được cung cấp các đoạn bình luận/nhận xét (Review) bằng Tiếng Việt. Nhiệm vụ của bạn là xây dựng một mô hình NLP để dự đoán cảm xúc (Sentiment) của đoạn văn bản đó. 
Cảm xúc được chia làm 3 loại:
- **Positive**: Tích cực (Khen ngợi, hài lòng).
- **Negative**: Tiêu cực (Chê bai, thất vọng).
- **Neutral**: Trung tính (Không khen không chê, chỉ mô tả).

## 📊 Dữ liệu (Dataset)
Dữ liệu là các câu bình luận thô, mang đậm tính giao tiếp thực tế của Tiếng Việt (có thể chứa teencode, viết tắt, hoặc sai chính tả).
- `train.csv`: Chứa `ReviewId`, `ReviewText` và cột `Sentiment`.
- `test.csv`: Chứa `ReviewId` và đoạn văn bản `ReviewText`. Bạn cần dự đoán cảm xúc của các văn bản này.

## 🏆 Đánh giá (Evaluation)
Mô hình được đánh giá thông qua chỉ số **Macro F1-Score**.
Bài toán phân loại đa lớp trên văn bản thường gặp hiện tượng mất cân bằng dữ liệu (số lượng bình luận tích cực thường áp đảo). Macro F1-Score đảm bảo rằng khả năng dự đoán đúng nhóm thiểu số (như Neutral) cũng quan trọng ngang với nhóm đa số.

$$F1 = 2 \times \frac{Precision \times Recall}{Precision + Recall}$$

## 📤 Hướng dẫn nộp bài (Submission)
File submit của bạn phải ở định dạng `.csv` có 2 cột:
- `ReviewId`: ID của bình luận.
- `Sentiment`: Kết quả phân tích (`Positive`, `Negative`, hoặc `Neutral`).

File nộp bài mẫu có thể xem tại `sample_submission.csv`.

# 🎓 Predict Student Dropout and Academic Success

## 📖 Bối cảnh (Context)
Tại các trường Đại học, tỷ lệ sinh viên bỏ học (Dropout) ảnh hưởng trực tiếp đến chất lượng đào tạo và uy tín của nhà trường. Việc phát hiện sớm những sinh viên có nguy cơ bỏ học sẽ giúp nhà trường và các cố vấn học tập có các biện pháp hỗ trợ, can thiệp kịp thời (như tư vấn tâm lý, hỗ trợ tài chính, phụ đạo học tập).

## 🎯 Nhiệm vụ của bạn
Bạn được cung cấp một bộ dữ liệu toàn diện chứa thông tin nhân khẩu học, kinh tế xã hội và kết quả học tập của các sinh viên.
Nhiệm vụ của bạn là xây dựng mô hình dự đoán để phân loại trạng thái học tập của sinh viên. Sinh viên thuộc nhóm nào trong 3 nhóm sau:
- **Graduate**: Đã tốt nghiệp.
- **Enrolled**: Đang theo học bình thường.
- **Dropout**: Đã bỏ học.

## 📊 Dữ liệu (Dataset)
Dữ liệu bao gồm các thông tin từ lúc sinh viên nộp hồ sơ nhập học cho đến kết quả học tập cuối các học kỳ đầu tiên.
- `train.csv`: Chứa các đặc trưng (features) và biến mục tiêu `Target`.
- `test.csv`: Chứa các đặc trưng nhưng ẩn biến mục tiêu. Bạn sẽ dự đoán cho các `StudentId` trong file này.

Một số trường dữ liệu tiêu biểu:
- *Marital status*: Tình trạng hôn nhân.
- *Application mode / Application order*: Hình thức ứng tuyển.
- *Previous qualification*: Trình độ học vấn trước đó.
- *Tuition fees up to date*: Tình trạng đóng học phí (Có nợ môn/nợ học phí hay không).
- *Curricular units 1st sem (approved/grade)*: Điểm số và số tín chỉ đạt được trong học kỳ 1.

## 🏆 Đánh giá (Evaluation)
Bài thi được đánh giá bằng chỉ số **Macro F1-Score**.
Vì dữ liệu trong bài toán này có sự mất cân bằng nhẹ giữa các lớp (sinh viên tốt nghiệp thường nhiều hơn sinh viên bỏ học), F1-Score sẽ đo lường hiệu suất một cách công bằng hơn cho tất cả các nhóm (Graduate, Enrolled, Dropout).

$$F1 = 2 \times \frac{Precision \times Recall}{Precision + Recall}$$

## 📤 Hướng dẫn nộp bài (Submission)
Bạn cần nộp file `.csv` gồm 2 cột:
- `StudentId`: Mã số sinh viên.
- `Target`: Trạng thái dự đoán (Vui lòng điền đúng text nhãn: `Graduate`, `Enrolled`, `Dropout`).

Hãy xem file `sample_submission.csv` để đối chiếu format nộp bài chuẩn nhé!

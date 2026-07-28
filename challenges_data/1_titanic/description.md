# 🚢 Titanic: Machine Learning from Disaster

## 📖 Bối cảnh (Context)
Vụ đắm tàu Titanic là một trong những thảm họa hàng hải khét tiếng nhất trong lịch sử. Vào ngày 15 tháng 4 năm 1912, trong chuyến đi đầu tiên của mình, con tàu RMS Titanic được mệnh danh là "không thể chìm" đã chìm sau khi va chạm với một tảng băng trôi. Đáng buồn thay, không có đủ thuyền cứu sinh cho tất cả mọi người trên tàu, dẫn đến cái chết của 1502 trong số 2224 hành khách và thủy thủ đoàn.

Mặc dù việc sống sót có yếu tố may mắn, nhưng có vẻ như một số nhóm người có khả năng sống sót cao hơn những người khác.

## 🎯 Nhiệm vụ của bạn
Trong thử thách này, bạn sẽ đóng vai trò là một Data Scientist. Nhiệm vụ của bạn là xây dựng một mô hình dự đoán để trả lời câu hỏi: **"Những loại người nào có khả năng sống sót cao hơn?"** sử dụng dữ liệu hành khách (như tên, tuổi, giới tính, hạng vé, v.v.).

## 📊 Dữ liệu (Dataset)
Dữ liệu được chia thành hai nhóm:
- `train.csv`: Tập huấn luyện (chứa thông tin hành khách và cột mục tiêu `Survived`).
- `test.csv`: Tập kiểm thử (chỉ chứa thông tin hành khách, bạn cần dự đoán cột `Survived`).

**Mô tả các trường dữ liệu (Data Dictionary):**
- `PassengerId`: ID của hành khách.
- `Pclass`: Hạng vé (1 = Hạng nhất, 2 = Hạng hai, 3 = Hạng ba).
- `Sex`: Giới tính.
- `Age`: Tuổi tính bằng năm.
- `SibSp`: Số lượng anh chị em / vợ chồng trên tàu.
- `Parch`: Số lượng cha mẹ / con cái trên tàu.
- `Ticket`: Số vé.
- `Fare`: Giá vé hành khách.
- `Cabin`: Số phòng cabin.
- `Embarked`: Cảng lên tàu (C = Cherbourg, Q = Queenstown, S = Southampton).
- `Survived`: **Biến mục tiêu** (0 = Không sống sót, 1 = Sống sót).

## 🏆 Đánh giá (Evaluation)
Bài làm của bạn sẽ được đánh giá dựa trên **Accuracy Score** (Tỷ lệ phân loại chính xác), tức là phần trăm số hành khách mà bạn dự đoán đúng trạng thái sống sót.

$$Accuracy = \frac{TP + TN}{TP + TN + FP + FN}$$

## 📤 Hướng dẫn nộp bài (Submission)
File nộp bài của bạn phải là định dạng `.csv` bao gồm đúng 2 cột: `PassengerId` và `Survived`.
Vui lòng tham khảo file `sample_submission.csv` để biết thêm chi tiết.

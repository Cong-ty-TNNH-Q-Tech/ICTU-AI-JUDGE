# Hướng dẫn Viết Custom Metric — ICTU AI JUDGE

Tài liệu này mô tả protocol (giao thức) bắt buộc để viết script `metric.py` chấm điểm tùy chỉnh trong hệ thống ICTU AI JUDGE.

---

## 1. Protocol `calculate_score()`

Mọi script `metric.py` **bắt buộc** phải định nghĩa hàm:

```python
def calculate_score(ground_truth_path: str, submission_path: str) -> float:
```

| Tham số | CSV Mode | ZIP Mode |
|---------|----------|----------|
| `ground_truth_path` | Đường dẫn file `.csv` (ví dụ: `/tmp/ground_truth.csv`) | Đường dẫn **thư mục** giải nén GT (ví dụ: `/tmp/ground_truth/`) |
| `submission_path` | Đường dẫn file `.csv` (ví dụ: `/tmp/submission.csv`) | Đường dẫn **thư mục** giải nén bài nộp (ví dụ: `/tmp/submission/`) |

**Quy tắc:**
- Trả về `float` — điểm số của bài nộp
- Dùng `raise ValueError(...)` hoặc `raise Exception(...)` khi có lỗi
- Không dùng `print()` cho debug (stdout chỉ được dùng để trả kết quả)
- KHÔNG ghi file ra ngoài thư mục được cấp (`/tmp/`)

---

## 2. CSV Mode (hiện tại)

Khi Admin upload Ground Truth dạng `.csv`:

```python
def calculate_score(ground_truth_path: str, submission_path: str) -> float:
    import pandas as pd
    from sklearn.metrics import accuracy_score

    gt = pd.read_csv(ground_truth_path)
    sub = pd.read_csv(submission_path)

    # Cột Usage (Public/Private) sẽ có sẵn trong GT
    # Metric script tự bỏ cột này khi cần
    if 'Usage' in gt.columns:
        gt = gt.drop(columns=['Usage'])

    target_col = gt.columns[-1]
    if len(gt) != len(sub):
        raise ValueError(f"Expected {len(gt)} rows, but got {len(sub)}")

    score = accuracy_score(gt[target_col], sub[target_col])
    return float(score)
```

---

## 3. ZIP Mode (mới — Issue #122)

### 3.1. Quy ước Ground Truth ZIP

Admin upload `.zip` chứa dữ liệu chấm điểm (ảnh, text, audio...). File `.zip` **bắt buộc** chứa:

1. **`ground_truth.csv`**: CSV 3 cột — `filename`, `label`, `Usage`

| filename | label | Usage |
|----------|-------|-------|
| img_001.png | cat | Public |
| img_002.png | dog | Private |
| img_003.png | cat | Public |

2. Các file dữ liệu tương ứng với cột `filename` (cùng thư mục gốc trong zip)

### 3.2. Quy ước Submission ZIP

#### Nếu Admin dùng **Custom Metric**:

Thí sinh nộp `.zip` chứa file kết quả theo format do Admin quy định trong `metric.py`. Admin tự kiểm tra cấu trúc trong script.

#### Nếu Admin dùng **Built-in Metric** (Accuracy, F1, RMSE):

Thí sinh nộp `.zip` **bắt buộc chứa file `submission.csv`** chứa kết quả dự đoán, cùng số dòng với `ground_truth.csv`. Ví dụ:

```csv
filename,label
img_001.png,cat
img_002.png,dog
img_003.png,cat
```

### 3.3. Custom Metric cho ZIP

```python
def calculate_score(ground_truth_path: str, submission_path: str) -> float:
    """
    ground_truth_path: thư mục chứa ground_truth.csv + các file dữ liệu (đã giải nén)
    submission_path: thư mục chứa file kết quả của thí sinh (đã giải nén)
    """
    import os
    import pandas as pd

    gt_csv = pd.read_csv(os.path.join(ground_truth_path, 'ground_truth.csv'))

    total_score = 0.0
    count = 0
    for _, row in gt_csv.iterrows():
        filename = row['filename']
        gt_file = os.path.join(ground_truth_path, filename)
        sub_file = os.path.join(submission_path, filename)
        # ... xử lý file, tính điểm từng file ...
        total_score += score
        count += 1

    return float(total_score / count) if count > 0 else 0.0
```

---

## 4. Giới hạn Sandbox

| Giới hạn | Giá trị |
|----------|--------|
| RAM | 512 MB |
| CPU | 50% của 1 core |
| Timeout CSV | 30 giây |
| Timeout ZIP | 120 giây |
| Network | **Đã chặn hoàn toàn** |
| File system | Chỉ ghi được trong `/tmp/` |

---

## 5. Các thư viện có sẵn trong Sandbox

| Thư viện | Import | Mục đích |
|----------|--------|----------|
| pandas | `import pandas as pd` | Đọc CSV, xử lý dữ liệu |
| numpy | `import numpy as np` | Tính toán số học |
| scikit-learn | `from sklearn.metrics import ...` | Accuracy, F1, RMSE, Precision, Recall |
| OpenCV | `import cv2` | Xử lý ảnh (PSNR, SSIM tự tính) |
| Pillow | `from PIL import Image` | Đọc/ghi ảnh |
| NLTK | `import nltk` | NLP cơ bản |
| SacreBLEU | `from sacrebleu.metrics import BLEU` | Tính BLEU score |
| scikit-image | `from skimage.metrics import structural_similarity` | SSIM |

---

## 6. Cách Test Metric

### Test qua Admin UI

Trong form tạo/sửa Challenge → chọn Custom Metric → upload `metric.py` → upload sample GT và submission → bấm "Test Evaluation Script".

### Test qua API

```bash
curl -X POST http://localhost:8000/api/v1/admin/challenges/test-metric \
  -F "ground_truth=@ground_truth.csv" \
  -F "submission=@submission.csv" \
  -F "metric_script=@metric.py" \
  -F "metric_name=CUSTOM" \
  -b "access_token=<JWT>"
```

Kết quả trả về: `{"score": 0.8542}` hoặc lỗi chi tiết nếu script fail.

---

## 7. Ví dụ Code Mẫu

Xem các file template trong thư mục `templates/metrics/`:

| File | Mô tả |
|------|-------|
| `psnr_template.py` | PSNR cho ảnh (ZIP mode) |
| `ssim_template.py` | SSIM cho ảnh (ZIP mode) |
| `bleu_template.py` | BLEU cho text generation (ZIP mode) |
| `imbalanced_metric_template.py` | Precision/Recall/F1 cho dữ liệu mất cân bằng (CSV mode) |

---

## 8. Lưu ý quan trọng

- **Không dùng `print()`** trong metric script. Chỉ `print(float_score)` ở cuối hoặc raise Exception khi lỗi.
- **Timeout**: Nếu metric quá 30s (CSV) hoặc 120s (ZIP), sandbox bị kill và submission chuyển `FAILED`.
- **Backward compatible**: CSV mode **không thay đổi** — mọi metric CSV cũ vẫn hoạt động bình thường.
- **Metric locked**: Khi challenge đã có submission thành công, không thể sửa metric hoặc upload lại Ground Truth.

# 📁 Pretrained Weights

Thư mục này dùng để lưu trữ các file **model weights đã huấn luyện sẵn** (pretrained model weights) cho các bài thi CV/NLP.

> **Lưu ý:** Thư mục này **KHÔNG được commit lên Git** (đã có trong `.gitignore`).  
> Admin có trách nhiệm tự tải và đặt weights vào đây trên từng máy chủ.

---

## Cấu trúc thư mục khuyến nghị

```
pretrained_weights/
├── challenge-<challenge_id>/       # Weights riêng cho từng bài thi
│   ├── model.pth                   # PyTorch checkpoint
│   ├── config.json                 # Config model
│   └── tokenizer/                  # Tokenizer (nếu NLP)
│       ├── vocab.txt
│       └── tokenizer_config.json
└── shared/                         # Weights dùng chung cho nhiều bài thi
    └── bert-base-multilingual/
        └── pytorch_model.bin
```

---

## Cách sử dụng trong Custom Metric Script

Weights được mount vào container tại đường dẫn **`/weights`** (read-only).

```python
# Ví dụ: Custom Metric Script (metric.py) cho bài thi CV
import torch

def calculate_score(ground_truth_dir: str, submission_dir: str) -> float:
    # Load model từ đường dẫn /weights (được mount tự động bởi hệ thống)
    model = torch.load("/weights/challenge-xxx/model.pth", map_location="cpu")
    model.eval()

    # ... logic tính điểm
    return score
```

---

## Hướng dẫn tải weights

### PyTorch model thông thường
```bash
# Copy file weight vào thư mục tương ứng
cp /path/to/your/model.pth backend/pretrained_weights/challenge-<id>/model.pth
```

### HuggingFace model
```bash
pip install huggingface_hub
python -c "
from huggingface_hub import snapshot_download
snapshot_download(
    repo_id='bert-base-multilingual-cased',
    local_dir='backend/pretrained_weights/shared/bert-base-multilingual'
)
"
```

---

## Lưu ý bảo mật
- Weights được mount **Read-Only** vào container sandbox → Code của sinh viên **không thể ghi đè** hoặc đánh cắp weights.
- Chỉ Custom Metric Script (do Admin upload) mới có thể đọc weights từ `/weights`.

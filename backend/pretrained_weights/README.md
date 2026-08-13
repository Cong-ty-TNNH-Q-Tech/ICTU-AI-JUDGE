# 📁 Pretrained Weights

Thư mục này lưu trữ các **pretrained model weights** dùng trong Custom Metric Script của Admin để chấm điểm bài thi CV/NLP.

> **Git LFS đang được dùng** — Các file `.pth`, `.bin`, `.safetensors`, `.onnx`, `.h5` được tự động upload qua Git LFS khi `git push`.

---

## Tải weights về

```bash
# Cài dependencies trước
pip install torch torchvision huggingface_hub

# Chạy script tải (~880MB tổng)
python backend/pretrained_weights/download_weights.py
```

---

## Cấu trúc thư mục sau khi tải

```
pretrained_weights/
├── download_weights.py           ← Script tải weights
├── shared/
│   ├── inception_v3/
│   │   └── inception_v3.pth      (~90MB)  — FID score
│   ├── bert-base-multilingual-cased/
│   │   ├── pytorch_model.bin     (~440MB) — BERTScore
│   │   ├── config.json
│   │   └── tokenizer_config.json
│   └── clip-vit-base-patch32/
│       ├── pytorch_model.bin     (~350MB) — CLIP Score
│       └── config.json
└── challenge-<uuid>/             ← Weights riêng cho bài thi cụ thể
    └── model.pth
```

---

## Weights & Đường dẫn trong Container

Thư mục này được mount **Read-Only** vào container tại `/weights`.

| Model | Đường dẫn trong container | Dùng cho |
|---|---|---|
| Inception v3 | `/weights/shared/inception_v3/inception_v3.pth` | FID Score (Image Generation) |
| BERT-multilingual | `/weights/shared/bert-base-multilingual-cased/` | BERTScore (NLP) |
| CLIP ViT-B/32 | `/weights/shared/clip-vit-base-patch32/` | CLIP Score (Vision-Language) |

---

## Ví dụ Custom Metric Script

### FID Score (Image Generation)
```python
import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
import os

def calculate_score(ground_truth_dir: str, submission_dir: str) -> float:
    # Load Inception v3 từ weights đã mount
    model = models.inception_v3(pretrained=False)
    model.load_state_dict(torch.load("/weights/shared/inception_v3/inception_v3.pth"))
    model.eval()

    # ... tính FID score
    return fid_score
```

### BERTScore (NLP - dịch máy, tóm tắt văn bản)
```python
from transformers import BertTokenizer, BertModel
import torch, pandas as pd

def calculate_score(ground_truth_dir: str, submission_dir: str) -> float:
    tokenizer = BertTokenizer.from_pretrained("/weights/shared/bert-base-multilingual-cased")
    model = BertModel.from_pretrained("/weights/shared/bert-base-multilingual-cased")
    model.eval()

    gt = pd.read_csv(f"{ground_truth_dir}/ground_truth.csv")
    sub = pd.read_csv(f"{submission_dir}/submission.csv")

    # ... tính BERTScore
    return bert_score
```

### CLIP Score (Vision-Language)
```python
from transformers import CLIPModel, CLIPProcessor
import torch

def calculate_score(ground_truth_dir: str, submission_dir: str) -> float:
    model = CLIPModel.from_pretrained("/weights/shared/clip-vit-base-patch32")
    processor = CLIPProcessor.from_pretrained("/weights/shared/clip-vit-base-patch32")
    model.eval()

    # ... tính CLIP score
    return clip_score
```

"""
Script tải pretrained weights về thư mục backend/pretrained_weights/
Chạy lệnh: python backend/pretrained_weights/download_weights.py

Các model được tải:
  1. Inception v3       (~90MB)  — FID score cho Image Generation
  2. BERT-base-multilingual (~440MB) — BERTScore cho NLP
  3. CLIP ViT-B/32      (~350MB) — CLIP Score cho Vision-Language
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def download_inception_v3():
    """Tải Inception v3 weights qua torchvision (dùng cho FID score)."""
    print("\n[1/3] Đang tải Inception v3 (~90MB)...")
    try:
        import torch
        import torchvision.models as models

        save_path = os.path.join(BASE_DIR, "shared", "inception_v3")
        os.makedirs(save_path, exist_ok=True)

        model = models.inception_v3(weights=models.Inception_V3_Weights.DEFAULT)
        model.eval()
        torch.save(model.state_dict(), os.path.join(save_path, "inception_v3.pth"))
        print(f"   ✅ Saved → {save_path}/inception_v3.pth")
    except ImportError:
        print("   ❌ Thiếu torch/torchvision. Chạy: pip install torch torchvision")


def download_bert_multilingual():
    """Tải BERT-base-multilingual-cased qua HuggingFace (dùng cho BERTScore)."""
    print("\n[2/3] Đang tải BERT-base-multilingual-cased (~440MB)...")
    try:
        from huggingface_hub import snapshot_download

        save_path = os.path.join(BASE_DIR, "shared", "bert-base-multilingual-cased")
        snapshot_download(
            repo_id="google-bert/bert-base-multilingual-cased",
            local_dir=save_path,
            ignore_patterns=["*.msgpack", "*.h5", "flax_model*", "tf_model*", "rust_model*"],
        )
        print(f"   ✅ Saved → {save_path}/")
    except ImportError:
        print("   ❌ Thiếu huggingface_hub. Chạy: pip install huggingface_hub")


def download_clip():
    """Tải CLIP ViT-B/32 qua HuggingFace (dùng cho CLIP Score)."""
    print("\n[3/3] Đang tải CLIP ViT-B/32 (~350MB)...")
    try:
        from huggingface_hub import snapshot_download

        save_path = os.path.join(BASE_DIR, "shared", "clip-vit-base-patch32")
        snapshot_download(
            repo_id="openai/clip-vit-base-patch32",
            local_dir=save_path,
            ignore_patterns=["*.msgpack", "*.h5", "flax_model*", "tf_model*"],
        )
        print(f"   ✅ Saved → {save_path}/")
    except ImportError:
        print("   ❌ Thiếu huggingface_hub. Chạy: pip install huggingface_hub")


def check_dependencies():
    missing = []
    try:
        import torch  # noqa: F401
        import torchvision  # noqa: F401
    except ImportError:
        missing.append("torch torchvision")
    try:
        from huggingface_hub import snapshot_download  # noqa: F401
    except ImportError:
        missing.append("huggingface_hub")

    if missing:
        print("❌ Thiếu dependencies. Chạy lệnh sau rồi thử lại:")
        print(f"   pip install {' '.join(missing)}")
        sys.exit(1)


if __name__ == "__main__":
    print("=" * 60)
    print(" ICTU AI JUDGE — Tải Pretrained Weights")
    print("=" * 60)
    print(f" Thư mục lưu: {BASE_DIR}/shared/")
    print(" Tổng dung lượng ước tính: ~880MB")
    print("=" * 60)

    check_dependencies()

    download_inception_v3()
    download_bert_multilingual()
    download_clip()

    print("\n" + "=" * 60)
    print(" ✅ Tất cả weights đã được tải xong!")
    print(" Đường dẫn trong container sandbox: /weights/shared/<model-name>/")
    print("=" * 60)

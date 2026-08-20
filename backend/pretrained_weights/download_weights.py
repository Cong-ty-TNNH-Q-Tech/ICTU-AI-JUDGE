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
    """Tải Inception v3 weights trực tiếp qua URL (dùng cho FID score)."""
    print("\n[1/3] Đang tải Inception v3 (~90MB)...")
    try:
        import torch

        save_dir = os.path.join(BASE_DIR, "shared", "inception_v3")
        os.makedirs(save_dir, exist_ok=True)
        save_path = os.path.join(save_dir, "inception_v3.pth")

        if os.path.exists(save_path):
            print("   ✔️ Đã có sẵn → bỏ qua.")
            return

        url = "https://download.pytorch.org/models/inception_v3_google-0cc3c7bd.pth"
        torch.hub.download_url_to_file(url, save_path, hash_prefix=None, progress=True)
        print(f"   ✅ Saved → {save_path}")
    except ImportError:
        print("   ❌ Thiếu torch. Chạy: pip install torch")


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
    except ImportError:
        missing.append("torch")
    try:
        import numpy  # noqa: F401
    except ImportError:
        missing.append("numpy")
    try:
        from huggingface_hub import snapshot_download  # noqa: F401
    except ImportError:
        missing.append("huggingface_hub")

    if missing:
        print("\u274c Thiếu dependencies. Chạy lệnh sau rồi thử lại:")
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

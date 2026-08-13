"""Template: PSNR (Peak Signal-to-Noise Ratio) cho ảnh."""
import os
import numpy as np
from PIL import Image


def calculate_score(ground_truth_dir: str, submission_dir: str) -> float:
    """
    Tính PSNR trung bình trên tất cả ảnh trong dataset.

    Args:
        ground_truth_dir: Thư mục chứa ground_truth.csv + ảnh gốc
        submission_dir: Thư mục chứa ảnh dự đoán của thí sinh

    Returns:
        float: PSNR trung bình (dB), càng cao càng tốt.
               Trả về inf nếu ảnh giống hệt.

    Raises:
        ValueError: Nếu thiếu file hoặc kích thước ảnh không khớp.
    """
    import pandas as pd

    gt_csv = pd.read_csv(os.path.join(ground_truth_dir, 'ground_truth.csv'))

    total_psnr = 0.0
    count = 0

    for _, row in gt_csv.iterrows():
        filename = row['filename']

        gt_img = np.array(
            Image.open(os.path.join(ground_truth_dir, filename)),
            dtype=np.float64
        )

        sub_path = os.path.join(submission_dir, filename)
        if not os.path.exists(sub_path):
            raise ValueError(f"Missing submission file: {filename}")

        sub_img = np.array(Image.open(sub_path), dtype=np.float64)

        if gt_img.shape != sub_img.shape:
            raise ValueError(
                f"Size mismatch for {filename}: "
                f"gt={gt_img.shape} vs sub={sub_img.shape}"
            )

        mse = np.mean((gt_img - sub_img) ** 2)
        if mse == 0:
            psnr = float('inf')
        else:
            psnr = 20 * np.log10(255.0 / np.sqrt(mse))

        total_psnr += psnr
        count += 1

    return float(total_psnr / count) if count > 0 else 0.0

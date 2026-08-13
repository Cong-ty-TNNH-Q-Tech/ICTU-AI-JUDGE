"""Template: SSIM (Structural Similarity Index) cho ảnh."""
import os
import numpy as np
from PIL import Image
from skimage.metrics import structural_similarity as ssim


def calculate_score(ground_truth_dir: str, submission_dir: str) -> float:
    """
    Tính SSIM trung bình trên tất cả ảnh trong dataset.

    Args:
        ground_truth_dir: Thư mục chứa ground_truth.csv + ảnh gốc
        submission_dir: Thư mục chứa ảnh dự đoán của thí sinh

    Returns:
        float: SSIM trung bình (0.0 - 1.0), càng cao càng tốt.

    Raises:
        ValueError: Nếu thiếu file hoặc kích thước ảnh không khớp.
    """
    import pandas as pd

    gt_csv = pd.read_csv(os.path.join(ground_truth_dir, 'ground_truth.csv'))

    total_ssim = 0.0
    count = 0

    for _, row in gt_csv.iterrows():
        filename = row['filename']

        gt_img = np.array(
            Image.open(os.path.join(ground_truth_dir, filename)).convert('L')
        )

        sub_path = os.path.join(submission_dir, filename)
        if not os.path.exists(sub_path):
            raise ValueError(f"Missing submission file: {filename}")

        sub_img = np.array(Image.open(sub_path).convert('L'))

        if gt_img.shape != sub_img.shape:
            raise ValueError(
                f"Size mismatch for {filename}: "
                f"gt={gt_img.shape} vs sub={sub_img.shape}"
            )

        score = ssim(gt_img, sub_img, data_range=255)
        total_ssim += score
        count += 1

    return float(total_ssim / count) if count > 0 else 0.0

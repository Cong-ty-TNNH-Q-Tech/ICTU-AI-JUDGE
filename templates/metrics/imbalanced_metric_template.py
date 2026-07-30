"""Template: Precision/Recall/F1 cho dữ liệu mất cân bằng."""
import pandas as pd
from sklearn.metrics import precision_score, recall_score, f1_score


def calculate_score(ground_truth_path: str, submission_path: str) -> float:
    """
    Tính F1-Score với class weight='balanced' cho dữ liệu mất cân bằng.

    Có thể đổi sang precision_score hoặc recall_score tùy bài toán:
    - precision_score: dùng khi False Positive có chi phí cao
    - recall_score: dùng khi False Negative có chi phí cao
    - f1_score average='weighted': cân bằng, có trọng số theo class size
    - f1_score average='macro': trung bình không trọng số (mọi class như nhau)

    Args:
        ground_truth_path: Đường dẫn file CSV ground truth
        submission_path: Đường dẫn file CSV bài nộp

    Returns:
        float: Điểm F1-Score weighted (0.0 - 1.0).

    Raises:
        ValueError: Nếu số dòng không khớp.
    """
    gt = pd.read_csv(ground_truth_path)
    sub = pd.read_csv(submission_path)

    target_col = gt.columns[-1]

    if len(gt) != len(sub):
        raise ValueError(
            f"Expected {len(gt)} rows, but got {len(sub)}"
        )

    y_true = gt[target_col]
    y_pred = sub[target_col]

    # Đổi metric tại đây nếu cần:
    # score = precision_score(y_true, y_pred, average='weighted', zero_division=0)
    # score = recall_score(y_true, y_pred, average='weighted', zero_division=0)
    score = f1_score(y_true, y_pred, average='weighted', zero_division=0)

    return float(score)

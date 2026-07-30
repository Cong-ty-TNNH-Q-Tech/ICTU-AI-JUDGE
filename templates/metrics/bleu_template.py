"""Template: BLEU score cho NLP text generation."""
import os


def calculate_score(ground_truth_dir: str, submission_dir: str) -> float:
    """
    Tính BLEU score trung bình trên tất cả câu trong dataset.

    Args:
        ground_truth_dir: Thư mục chứa ground_truth.csv + file text gốc
        submission_dir: Thư mục chứa file text dự đoán của thí sinh

    Returns:
        float: BLEU score (0 - 100), càng cao càng tốt.

    Raises:
        ValueError: Nếu thiếu file submission.
    """
    import pandas as pd
    from sacrebleu.metrics import BLEU

    bleu = BLEU()

    gt_csv = pd.read_csv(os.path.join(ground_truth_dir, 'ground_truth.csv'))

    refs = []
    hyps = []

    for _, row in gt_csv.iterrows():
        filename = row['filename']

        with open(os.path.join(ground_truth_dir, filename), 'r', encoding='utf-8') as f:
            refs.append(f.read().strip())

        sub_path = os.path.join(submission_dir, filename)
        if not os.path.exists(sub_path):
            raise ValueError(f"Missing submission file: {filename}")

        with open(sub_path, 'r', encoding='utf-8') as f:
            hyps.append(f.read().strip())

    result = bleu.corpus_score(hyps, [refs])
    return float(result.score)

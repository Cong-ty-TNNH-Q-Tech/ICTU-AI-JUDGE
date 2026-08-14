def get_built_in_metric_script(metric_name: str, gt_path: str, sub_path: str) -> str:
    return f"""
import pandas as pd
import sys
import math
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, recall_score, precision_score

try:
    import os
    if not os.path.exists('{sub_path}'):
        print('Thiếu file submission. Vui lòng đặt file kết quả đúng vị trí.')
        sys.exit(1)
        
    gt = pd.read_csv('{gt_path}')
    sub = pd.read_csv('{sub_path}')

    if 'Usage' in gt.columns:
        gt = gt.drop(columns=['Usage'])

    if len(gt.columns) == 0:
        print('Không tìm thấy cột mục tiêu trong Ground Truth.')
        sys.exit(1)

    # Cột dự đoán (target) thường là cột cuối cùng sau khi bỏ 'Usage'
    target_col = gt.columns[-1]
    if target_col not in sub.columns:
        print(f'Thiếu cột {{target_col}} trong bài nộp.')
        sys.exit(1)

    if len(gt) != len(sub):
        print(f'Số lượng dòng không khớp. Kì vọng {{len(gt)}} dòng, nhưng nhận được {{len(sub)}} dòng.')
        sys.exit(1)

    y_true = gt[target_col].astype(str).tolist()
    y_pred = sub[target_col].astype(str).tolist()

    metric_name = '{metric_name}'

    if metric_name == 'ACCURACY':
        score = accuracy_score(y_true, y_pred)
    elif metric_name == 'F1_SCORE':
        score = f1_score(y_true, y_pred, average='macro')
    elif metric_name == 'RMSE':
        try:
            y_t = [float(x) for x in y_true]
            y_p = [float(x) for x in y_pred]
        except ValueError as e:
            print(f"Lỗi ép kiểu dữ liệu sang float khi tính RMSE. Vui lòng đảm bảo các cột dự đoán chỉ chứa số. Chi tiết: {{e}}")
            sys.exit(1)
        score = math.sqrt(mean_squared_error(y_t, y_p))
    elif metric_name == 'PRECISION':
        score = precision_score(y_true, y_pred, average='macro', zero_division=0)
    elif metric_name == 'RECALL':
        score = recall_score(y_true, y_pred, average='macro', zero_division=0)
    # ---- NLP Metrics ----
    elif metric_name == 'BLEU':
        import sacrebleu
        refs = [[r] for r in y_true]  # sacrebleu expects list-of-lists
        score = sacrebleu.corpus_bleu(y_pred, list(zip(*refs))).score / 100.0
    elif metric_name == 'ROUGE_L':
        from rouge_score import rouge_scorer
        scorer = rouge_scorer.RougeScorer(['rougeL'], use_stemmer=False)
        scores = [scorer.score(ref, hyp)['rougeL'].fmeasure
                  for ref, hyp in zip(y_true, y_pred)]
        score = sum(scores) / len(scores)
    elif metric_name == 'WER':
        from jiwer import wer
        score = 1.0 - wer(y_true, y_pred)  # convert to higher-is-better
    # ---- CV Metrics (CSV cột path ảnh) ----
    elif metric_name in ('PSNR', 'SSIM', 'MEAN_IOU'):
        import numpy as np
        from PIL import Image
        psnr_list, ssim_list, iou_list = [], [], []
        for ref_path, pred_path in zip(y_true, y_pred):
            ref_img  = np.array(Image.open(ref_path.strip()).convert('RGB'), dtype=np.float32)
            pred_img = np.array(Image.open(pred_path.strip()).convert('RGB'), dtype=np.float32)
            if metric_name == 'PSNR':
                mse = np.mean((ref_img - pred_img) ** 2)
                psnr_list.append(20 * math.log10(255.0 / math.sqrt(mse)) if mse > 0 else 100.0)
            elif metric_name == 'SSIM':
                from skimage.metrics import structural_similarity as ssim
                score_val = ssim(ref_img, pred_img, channel_axis=2, data_range=255.0)
                ssim_list.append(score_val)
            elif metric_name == 'MEAN_IOU':
                ref_mask  = np.array(Image.open(ref_path.strip()).convert('L')) > 127
                pred_mask = np.array(Image.open(pred_path.strip()).convert('L')) > 127
                intersection = (ref_mask & pred_mask).sum()
                union = (ref_mask | pred_mask).sum()
                iou_list.append(intersection / union if union > 0 else 1.0)
        if metric_name == 'PSNR': score = sum(psnr_list) / len(psnr_list)
        elif metric_name == 'SSIM': score = sum(ssim_list) / len(ssim_list)
        else: score = sum(iou_list) / len(iou_list)
    else:
        print(f'Built-in metric {{metric_name}} không được hỗ trợ.')
        sys.exit(1)

    print(score)
except Exception as e:
    print(f"Lỗi khi chấm điểm: {{str(e)}}")
    sys.exit(1)
"""

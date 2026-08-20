# -*- coding: utf-8 -*-
def get_built_in_metric_script(metric_name: str, gt_path: str, sub_path: str) -> str:
    return f"""
import pandas as pd
import sys
import math
import json
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, recall_score, precision_score, r2_score, mean_absolute_error, log_loss

def compute_score(y_true, y_pred, metric_name):
    if len(y_true) == 0: return None
    if metric_name == 'ACCURACY':
        return accuracy_score(y_true, y_pred)
    elif metric_name == 'F1_SCORE':
        return f1_score(y_true, y_pred, average='macro')
    elif metric_name == 'RMSE':
        try:
            y_t = [float(x) for x in y_true]
            y_p = [float(x) for x in y_pred]
        except ValueError as e:
            print(f"Lỗi ép kiểu dữ liệu sang float khi tính RMSE. Vui lòng đảm bảo các cột dự đoán chỉ chứa số. Chi tiết: {{e}}")
            sys.exit(1)
        return math.sqrt(mean_squared_error(y_t, y_p))
    elif metric_name == 'MAE':
        try:
            y_t = [float(x) for x in y_true]
            y_p = [float(x) for x in y_pred]
        except ValueError as e:
            print(f"Lỗi ép kiểu dữ liệu sang float khi tính MAE. Vui lòng đảm bảo các cột dự đoán chỉ chứa số. Chi tiết: {e}")
            sys.exit(1)
        return mean_absolute_error(y_t, y_p)
    elif metric_name == 'R2_SCORE':
        try:
            y_t = [float(x) for x in y_true]
            y_p = [float(x) for x in y_pred]
        except ValueError as e:
            print(f"Lỗi ép kiểu dữ liệu sang float khi tính R2 Score. Vui lòng đảm bảo các cột dự đoán chỉ chứa số. Chi tiết: {e}")
            sys.exit(1)
        import numpy as np
        if np.var(y_t) == 0:
            return 0.0
        return r2_score(y_t, y_p)
    elif metric_name == 'LOG_LOSS':
        try:
            y_t = [float(x) for x in y_true]
            y_p = [float(x) for x in y_pred]
        except ValueError as e:
            print(f"Lỗi ép kiểu dữ liệu sang float khi tính Log Loss. Vui lòng đảm bảo các cột dự đoán chỉ chứa số. Chi tiết: {e}")
            sys.exit(1)
        return log_loss(y_t, y_p)
    elif metric_name == 'PRECISION':
        return precision_score(y_true, y_pred, average='macro', zero_division=0)
    elif metric_name == 'RECALL':
        return recall_score(y_true, y_pred, average='macro', zero_division=0)
    elif metric_name == 'BLEU':
        import sacrebleu
        refs = [[r] for r in y_true]
        return sacrebleu.corpus_bleu(y_pred, list(zip(*refs))).score / 100.0
    elif metric_name == 'ROUGE_L':
        from rouge_score import rouge_scorer
        scorer = rouge_scorer.RougeScorer(['rougeL'], use_stemmer=False)
        scores = [scorer.score(ref, hyp)['rougeL'].fmeasure for ref, hyp in zip(y_true, y_pred)]
        return sum(scores) / len(scores)
    elif metric_name == 'WER':
        from jiwer import wer
        return 1.0 - wer(y_true, y_pred)
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
                ssim_list.append(ssim(ref_img, pred_img, channel_axis=2, data_range=255.0))
            elif metric_name == 'MEAN_IOU':
                ref_mask  = np.array(Image.open(ref_path.strip()).convert('L')) > 127
                pred_mask = np.array(Image.open(pred_path.strip()).convert('L')) > 127
                intersection = (ref_mask & pred_mask).sum()
                union = (ref_mask | pred_mask).sum()
                iou_list.append(intersection / union if union > 0 else 1.0)
        if metric_name == 'PSNR': return sum(psnr_list) / len(psnr_list)
        elif metric_name == 'SSIM': return sum(ssim_list) / len(ssim_list)
        else: return sum(iou_list) / len(iou_list)
    else:
        print(f'Built-in metric {{metric_name}} không được hỗ trợ.')
        sys.exit(1)

try:
    import os
    if not os.path.exists('{sub_path}'):
        print('Thiếu file submission. Vui lòng đặt file kết quả đúng vị trí.')
        sys.exit(1)
        
    gt = pd.read_csv('{gt_path}')
    sub = pd.read_csv('{sub_path}')

    has_usage = 'Usage' in gt.columns
    if has_usage:
        target_col = [col for col in gt.columns if col != 'Usage'][-1]
    else:
        target_col = gt.columns[-1]

    if target_col not in sub.columns:
        print(f'Thiếu cột {{target_col}} trong bài nộp.')
        sys.exit(1)

    if len(gt) != len(sub):
        print(f'Số lượng dòng không khớp. Kì vọng {{len(gt)}} dòng, nhưng nhận được {{len(sub)}} dòng.')
        sys.exit(1)

    sub['Usage'] = gt['Usage'] if has_usage else 'Public'
    
    gt_pub = gt[gt['Usage'] == 'Public'] if has_usage else gt
    sub_pub = sub[sub['Usage'] == 'Public'] if has_usage else sub
    
    gt_priv = gt[gt['Usage'] == 'Private'] if has_usage else pd.DataFrame(columns=gt.columns)
    sub_priv = sub[sub['Usage'] == 'Private'] if has_usage else pd.DataFrame(columns=sub.columns)
    
    y_true_pub = gt_pub[target_col].astype(str).tolist()
    y_pred_pub = sub_pub[target_col].astype(str).tolist()
    
    y_true_priv = gt_priv[target_col].astype(str).tolist()
    y_pred_priv = sub_priv[target_col].astype(str).tolist()

    metric_name = '{metric_name}'

    score_pub = compute_score(y_true_pub, y_pred_pub, metric_name)
    score_priv = compute_score(y_true_priv, y_pred_priv, metric_name) if len(y_true_priv) > 0 else None

    print(json.dumps({{"public_score": score_pub, "private_score": score_priv}}))
except Exception as e:
    print(f"Lỗi khi chấm điểm: {{str(e)}}")
    sys.exit(1)
"""

def get_metric_computation_code(metric_name: str, y_true_var: str = 'y_true', y_pred_var: str = 'y_pred', is_zip_mode: bool = False) -> str:
    """Trả về đoạn code Python tính điểm cho metric_name."""
    # Đoạn code mong đợi y_true và y_pred đã được định nghĩa
    
    cv_paths_logic = f"""
        for ref_path, pred_path in zip({y_true_var}, {y_pred_var}):
            ref_full  = f'/tmp/ground_truth/{{ref_path.strip()}}' if {is_zip_mode} else ref_path.strip()
            pred_full = f'/tmp/submission/{{pred_path.strip()}}' if {is_zip_mode} else pred_path.strip()
            ref_img   = np.array(Image.open(ref_full).convert('RGB'), dtype=np.float32)
            pred_img  = np.array(Image.open(pred_full).convert('RGB'), dtype=np.float32)
"""

    return f"""
    metric_name = '{metric_name}'
    if metric_name == 'ACCURACY':
        from sklearn.metrics import accuracy_score
        score = accuracy_score({y_true_var}, {y_pred_var})
    elif metric_name == 'F1_SCORE':
        from sklearn.metrics import f1_score
        score = f1_score({y_true_var}, {y_pred_var}, average='macro')
    elif metric_name == 'RMSE':
        from sklearn.metrics import mean_squared_error
        import math
        try:
            y_t = [float(x) for x in {y_true_var}]
            y_p = [float(x) for x in {y_pred_var}]
        except ValueError as e:
            print(f"Lỗi ép kiểu dữ liệu sang float khi tính RMSE. Vui lòng đảm bảo các cột dự đoán chỉ chứa số. Chi tiết: {{e}}")
            sys.exit(1)
        score = math.sqrt(mean_squared_error(y_t, y_p))
    elif metric_name == 'PRECISION':
        from sklearn.metrics import precision_score
        score = precision_score({y_true_var}, {y_pred_var}, average='macro', zero_division=0)
    elif metric_name == 'RECALL':
        from sklearn.metrics import recall_score
        score = recall_score({y_true_var}, {y_pred_var}, average='macro', zero_division=0)
    # ---- NLP Metrics ----
    elif metric_name == 'BLEU':
        import sacrebleu
        refs = [[r] for r in {y_true_var}]
        score = sacrebleu.corpus_bleu({y_pred_var}, list(zip(*refs))).score / 100.0
    elif metric_name == 'ROUGE_L':
        from rouge_score import rouge_scorer
        scorer = rouge_scorer.RougeScorer(['rougeL'], use_stemmer=False)
        scores = [scorer.score(ref, hyp)['rougeL'].fmeasure
                  for ref, hyp in zip({y_true_var}, {y_pred_var})]
        score = sum(scores) / len(scores)
    elif metric_name == 'WER':
        from jiwer import wer
        score = 1.0 - wer({y_true_var}, {y_pred_var})
    # ---- CV Metrics ----
    elif metric_name in ('PSNR', 'SSIM', 'MEAN_IOU'):
        import numpy as np
        import os
        from PIL import Image
        import math
        psnr_list, ssim_list, iou_list = [], [], []
{cv_paths_logic}
            if metric_name == 'PSNR':
                mse = np.mean((ref_img - pred_img) ** 2)
                psnr_list.append(20 * math.log10(255.0 / math.sqrt(mse)) if mse > 0 else 100.0)
            elif metric_name == 'SSIM':
                from skimage.metrics import structural_similarity as ssim
                ssim_list.append(ssim(ref_img, pred_img, channel_axis=2, data_range=255.0))
            elif metric_name == 'MEAN_IOU':
                ref_full  = f'/tmp/ground_truth/{{ref_path.strip()}}' if {is_zip_mode} else ref_path.strip()
                pred_full = f'/tmp/submission/{{pred_path.strip()}}' if {is_zip_mode} else pred_path.strip()
                ref_mask  = np.array(Image.open(ref_full).convert('L')) > 127
                pred_mask = np.array(Image.open(pred_full).convert('L')) > 127
                inter = (ref_mask & pred_mask).sum()
                union = (ref_mask | pred_mask).sum()
                iou_list.append(inter / union if union > 0 else 1.0)
        if metric_name == 'PSNR': score = sum(psnr_list) / len(psnr_list)
        elif metric_name == 'SSIM': score = sum(ssim_list) / len(ssim_list)
        else: score = sum(iou_list) / len(iou_list)
    else:
        print(f'Built-in metric {{metric_name}} không được hỗ trợ.')
        sys.exit(1)
"""

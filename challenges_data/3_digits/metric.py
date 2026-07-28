import pandas as pd
from sklearn.metrics import accuracy_score

def calculate_score(ground_truth_path: str, submission_path: str) -> float:
    gt = pd.read_csv(ground_truth_path)
    sub = pd.read_csv(submission_path)
    
    target_col = gt.columns[-1]
    
    # Ensure matching rows
    if len(gt) != len(sub):
        raise ValueError(f"Expected {len(gt)} rows, but got {len(sub)}")
        
    score = accuracy_score(gt[target_col], sub[target_col])
    return float(score)

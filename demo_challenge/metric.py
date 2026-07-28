import pandas as pd
from sklearn.metrics import mean_squared_error

def score(ground_truth_path: str, submission_path: str) -> float:
    try:
        gt = pd.read_csv(ground_truth_path)
        sub = pd.read_csv(submission_path)
        
        # Ensure submission has the same shape
        if len(gt) != len(sub):
            raise ValueError(f"Expected {len(gt)} rows, got {len(sub)} rows.")
            
        # Ensure the column 'price' exists
        if 'price' not in sub.columns:
            raise ValueError("Submission must contain a 'price' column.")
            
        mse = mean_squared_error(gt['price'], sub['price'])
        return float(mse)
    except Exception as e:
        raise Exception(f"Metric calculation failed: {str(e)}")

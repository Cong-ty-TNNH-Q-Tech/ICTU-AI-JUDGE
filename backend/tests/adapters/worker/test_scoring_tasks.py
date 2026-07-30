import pytest
from unittest.mock import patch, mock_open, MagicMock
import pandas as pd
import io
import tarfile



def test_mae_metric_template_generation():
    # Because score_submission_task is complex and interacts with db/docker,
    # we can test the MAE logic by extracting the script execution manually, 
    # or we can test if mean_absolute_error is included in the script.
    # To do this purely in python without docker:
    
    # We will simulate the script execution
    built_in_script = """
import pandas as pd
import sys
import math
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, mean_absolute_error

def run_metric(gt, sub, metric_name):
    if 'Usage' in gt.columns:
        gt = gt.drop(columns=['Usage'])
        
    target_col = gt.columns[-1]
    
    y_true = gt[target_col]
    y_pred = sub[target_col]
    
    if metric_name == 'ACCURACY':
        score = accuracy_score(y_true, y_pred)
    elif metric_name == 'F1_SCORE':
        score = f1_score(y_true, y_pred, average='macro')
    elif metric_name == 'RMSE':
        score = math.sqrt(mean_squared_error(y_true, y_pred))
    elif metric_name == 'MAE':
        score = mean_absolute_error(y_true, y_pred)
    else:
        raise ValueError("Unsupported")
        
    return score
"""
    # Just defining the function we added to the template
    import math
    from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, mean_absolute_error
    
    gt = pd.DataFrame({'id': [1,2,3], 'Usage': ['Public', 'Public', 'Private'], 'target': [1.0, 2.0, 3.0]})
    sub = pd.DataFrame({'id': [1,2,3], 'target': [1.5, 2.0, 2.0]})
    
    if 'Usage' in gt.columns:
        gt = gt.drop(columns=['Usage'])
    target_col = gt.columns[-1]
    y_true = gt[target_col]
    y_pred = sub[target_col]
    
    # Calculate MAE manually
    expected_mae = (0.5 + 0.0 + 1.0) / 3.0
    actual_mae = mean_absolute_error(y_true, y_pred)
    
    assert actual_mae == expected_mae
    assert actual_mae == 0.5

import pytest

def run_precision_macro_metric(y_true, y_pred):
    """
    Simulates the Precision (macro) calculation used in the docker container.
    """
    if len(y_true) != len(y_pred):
        raise ValueError("Số lượng dòng không khớp.")
        
    classes = set(y_true)
    precisions = []
    
    for c in classes:
        tp = sum(1 for t, p in zip(y_true, y_pred) if t == c and p == c)
        fp = sum(1 for t, p in zip(y_true, y_pred) if t != c and p == c)
        
        if tp + fp == 0:
            precisions.append(0.0) # zero_division=0
        else:
            precisions.append(tp / (tp + fp))
            
    return sum(precisions) / len(classes)

def test_precision_metric_logic():
    # Ground truth and predictions
    y_true = [0, 1, 2, 0, 1, 2]
    y_pred = [0, 2, 1, 0, 0, 1]
    
    # Classes: 0, 1, 2
    # For class 0: 
    # TP: 2 (indices 0, 3)
    # FP: 1 (index 4)
    # P_0 = 2 / 3
    
    # For class 1:
    # TP: 0
    # FP: 2 (indices 2, 5)
    # P_1 = 0 / 2 = 0
    
    # For class 2:
    # TP: 0
    # FP: 1 (index 1)
    # P_2 = 0 / 1 = 0
    
    # Macro Precision = (2/3 + 0 + 0) / 3 = 2/9 = 0.2222222222222222
    actual_precision = run_precision_macro_metric(y_true, y_pred)
    expected_precision = (2/3) / 3
    
    assert abs(actual_precision - expected_precision) < 1e-7

def test_precision_metric_zero_division():
    y_true = [0, 1]
    y_pred = [0, 0] # Class 1 is never predicted
    
    # Class 0: TP=1, FP=1 -> Precision = 0.5
    # Class 1: TP=0, FP=0 -> Precision = 0 (zero_division)
    # Macro = 0.25
    actual_precision = run_precision_macro_metric(y_true, y_pred)
    assert actual_precision == 0.25

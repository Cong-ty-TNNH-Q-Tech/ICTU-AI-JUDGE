import pytest

def run_recall_macro_metric(y_true, y_pred):
    """
    Simulates the Recall (macro) calculation used in the docker container.
    """
    if len(y_true) != len(y_pred):
        raise ValueError("Số lượng dòng không khớp.")
        
    classes = set(y_true)
    recalls = []
    
    for c in classes:
        tp = sum(1 for t, p in zip(y_true, y_pred) if t == c and p == c)
        fn = sum(1 for t, p in zip(y_true, y_pred) if t == c and p != c)
        
        if tp + fn == 0:
            recalls.append(0.0) # zero_division=0
        else:
            recalls.append(tp / (tp + fn))
            
    return sum(recalls) / len(classes)

def test_recall_metric_logic():
    # Ground truth and predictions
    y_true = [0, 1, 2, 0, 1, 2]
    y_pred = [0, 2, 1, 0, 0, 1]
    
    # Classes: 0, 1, 2
    # For class 0: 
    # TP: 2 (indices 0, 3)
    # FN: 0
    # R_0 = 2 / 2 = 1.0
    
    # For class 1:
    # TP: 0
    # FN: 2 (indices 1, 4)
    # R_1 = 0 / 2 = 0.0
    
    # For class 2:
    # TP: 0
    # FN: 2 (indices 2, 5)
    # R_2 = 0 / 2 = 0.0
    
    # Macro Recall = (1.0 + 0.0 + 0.0) / 3 = 1/3 = 0.3333333333333333
    actual_recall = run_recall_macro_metric(y_true, y_pred)
    expected_recall = 1 / 3
    
    assert abs(actual_recall - expected_recall) < 1e-7

def test_recall_metric_zero_division():
    y_true = [0, 0]
    y_pred = [0, 1]
    
    # In this case, y_true only has class 0.
    # Class 0: TP=1, FN=1 -> Recall = 0.5
    # Macro = 0.5 (since only 1 class exists in y_true)
    actual_recall = run_recall_macro_metric(y_true, y_pred)
    assert actual_recall == 0.5

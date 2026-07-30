import pytest
import math

def run_log_loss_metric(y_true, y_pred):
    """
    Simulates the Log Loss calculation used in the docker container.
    Using math.log and clipping.
    """
    if len(y_true) != len(y_pred):
        raise ValueError("Số lượng dòng không khớp.")
        
    n = len(y_true)
    loss = 0.0
    eps = 1e-15
    
    for t, p in zip(y_true, y_pred):
        p = max(eps, min(1 - eps, p))
        loss += -(t * math.log(p) + (1 - t) * math.log(1 - p))
        
    return loss / n

def test_log_loss_metric_logic():
    # Ground truth and predictions
    y_true = [1, 0, 1, 0]
    y_pred = [0.9, 0.1, 0.8, 0.2]
    
    actual_loss = run_log_loss_metric(y_true, y_pred)
    
    # -(1*log(0.9) + 0 + 1*log(0.8) + 0) -> for true = 1
    # -(0 + 1*log(0.9) + 0 + 1*log(0.8)) -> for true = 0
    # Expected: -(log(0.9) + log(0.9) + log(0.8) + log(0.8)) / 4
    expected_loss = -(math.log(0.9) + math.log(0.9) + math.log(0.8) + math.log(0.8)) / 4
    
    assert abs(actual_loss - expected_loss) < 1e-7

def test_log_loss_metric_corner_cases():
    # p = 0 or 1 should be clipped
    y_true = [1, 0]
    y_pred = [0.0, 1.0]
    
    eps = 1e-15
    actual_loss = run_log_loss_metric(y_true, y_pred)
    expected_loss = -(math.log(eps) + math.log(eps)) / 2
    
    assert abs(actual_loss - expected_loss) < 1e-3

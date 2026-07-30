import pytest

def run_mae_metric(y_true, y_pred):
    """
    Simulates the MAE calculation used in the docker container.
    In the container, we use sklearn.metrics.mean_absolute_error,
    but here we test the equivalent mathematical logic to ensure correctness
    without depending on pandas or sklearn in the host environment.
    """
    if len(y_true) != len(y_pred):
        raise ValueError("Số lượng dòng không khớp.")
    
    total_error = sum(abs(t - p) for t, p in zip(y_true, y_pred))
    return total_error / len(y_true)

def test_mae_metric_logic():
    # Ground truth and predictions
    y_true = [1.0, 2.0, 3.0]
    y_pred = [1.5, 2.0, 2.0]
    
    # Calculate MAE manually: 
    # |1.0 - 1.5| = 0.5
    # |2.0 - 2.0| = 0.0
    # |3.0 - 2.0| = 1.0
    # Total = 1.5, Mean = 1.5 / 3 = 0.5
    
    expected_mae = 0.5
    actual_mae = run_mae_metric(y_true, y_pred)
    
    assert actual_mae == expected_mae

def test_mae_metric_zero_error():
    y_true = [5.5, 10.1]
    y_pred = [5.5, 10.1]
    assert run_mae_metric(y_true, y_pred) == 0.0

import pytest

def run_r2_metric(y_true, y_pred):
    """
    Simulates the R2 Score calculation used in the docker container.
    """
    if len(y_true) != len(y_pred):
        raise ValueError("Số lượng dòng không khớp.")
        
    n = len(y_true)
    mean_y = sum(y_true) / n
    var_y = sum((y - mean_y)**2 for y in y_true) / n
    
    if var_y == 0:
        return 0.0
        
    ss_tot = sum((y - mean_y)**2 for y in y_true)
    ss_res = sum((t - p)**2 for t, p in zip(y_true, y_pred))
    
    return 1 - (ss_res / ss_tot)

def test_r2_metric_logic():
    # Ground truth and predictions
    y_true = [3.0, -0.5, 2.0, 7.0]
    y_pred = [2.5, 0.0, 2.0, 8.0]
    
    actual_r2 = run_r2_metric(y_true, y_pred)
    
    # ss_tot: mean = 11.5 / 4 = 2.875
    # (3-2.875)^2 + (-0.5-2.875)^2 + (2-2.875)^2 + (7-2.875)^2
    # 0.015625 + 11.390625 + 0.765625 + 17.015625 = 29.1875
    
    # ss_res: (3-2.5)^2 + (-0.5-0)^2 + (2-2)^2 + (7-8)^2 
    # 0.25 + 0.25 + 0 + 1 = 1.5
    
    # R2 = 1 - 1.5/29.1875 = 0.948608137...
    expected_r2 = 1 - (1.5 / 29.1875)
    
    assert abs(actual_r2 - expected_r2) < 1e-7

def test_r2_metric_zero_variance():
    # True values are all the same -> Variance = 0
    # Expected behavior according to logic: return 0.0
    y_true = [5.0, 5.0, 5.0]
    y_pred = [5.0, 6.0, 4.0]
    assert run_r2_metric(y_true, y_pred) == 0.0

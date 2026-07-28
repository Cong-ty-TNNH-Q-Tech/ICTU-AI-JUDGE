import os
import pandas as pd
import numpy as np
from sklearn.datasets import fetch_openml, fetch_california_housing, load_digits
from sklearn.model_selection import train_test_split

BASE_DIR = "challenges_data"
os.makedirs(BASE_DIR, exist_ok=True)

def save_challenge_files(name, X_train, X_test, y_train, y_test, id_col, target_col, metric_code):
    folder = os.path.join(BASE_DIR, name)
    os.makedirs(folder, exist_ok=True)
    
    # train.csv (features + target)
    train_df = X_train.copy()
    train_df[target_col] = y_train
    train_df.to_csv(os.path.join(folder, "train.csv"), index=False)
    
    # test.csv (features only)
    X_test.to_csv(os.path.join(folder, "test.csv"), index=False)
    
    # ground_truth.csv (id + target)
    gt_df = pd.DataFrame({id_col: X_test[id_col], target_col: y_test})
    gt_df.to_csv(os.path.join(folder, "ground_truth.csv"), index=False)
    
    # sample_submission.csv (id + dummy target)
    sample_df = gt_df.copy()
    if pd.api.types.is_numeric_dtype(y_train):
        sample_df[target_col] = 0  # Default 0 for numbers
    else:
        sample_df[target_col] = y_train.iloc[0] # Default first class
    sample_df.to_csv(os.path.join(folder, "sample_submission.csv"), index=False)
    
    # metric.py
    with open(os.path.join(folder, "metric.py"), "w") as f:
        f.write(metric_code)
    
    print(f"Generated {name} successfully.")

# --- Metric Codes ---
ACCURACY_METRIC = """import pandas as pd
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
"""

RMSE_METRIC = """import pandas as pd
import numpy as np
from sklearn.metrics import mean_squared_error

def calculate_score(ground_truth_path: str, submission_path: str) -> float:
    gt = pd.read_csv(ground_truth_path)
    sub = pd.read_csv(submission_path)
    
    target_col = gt.columns[-1]
    
    if len(gt) != len(sub):
        raise ValueError(f"Expected {len(gt)} rows, but got {len(sub)}")
        
    rmse = np.sqrt(mean_squared_error(gt[target_col], sub[target_col]))
    return float(rmse)
"""

F1_METRIC = """import pandas as pd
from sklearn.metrics import f1_score

def calculate_score(ground_truth_path: str, submission_path: str) -> float:
    gt = pd.read_csv(ground_truth_path)
    sub = pd.read_csv(submission_path)
    
    target_col = gt.columns[-1]
    
    if len(gt) != len(sub):
        raise ValueError(f"Expected {len(gt)} rows, but got {len(sub)}")
        
    score = f1_score(gt[target_col], sub[target_col], average='macro')
    return float(score)
"""

print("Downloading and generating datasets... This might take a minute.")

# 1. Titanic
try:
    titanic = fetch_openml("titanic", version=1, as_frame=True, parser="auto")
    X = titanic.data
    y = titanic.target
    X['PassengerId'] = X.index
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    save_challenge_files("1_titanic", X_train, X_test, y_train, y_test, "PassengerId", "Survived", ACCURACY_METRIC)
except Exception as e:
    print("Titanic failed:", e)

# 2. California Housing
try:
    housing = fetch_california_housing(as_frame=True)
    X = housing.data
    y = housing.target
    X['Id'] = X.index
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    save_challenge_files("2_housing", X_train, X_test, y_train, y_test, "Id", "MedHouseVal", RMSE_METRIC)
except Exception as e:
    print("Housing failed:", e)

# 3. Digits
try:
    digits = load_digits(as_frame=True)
    X = digits.data
    y = digits.target
    X['ImageId'] = X.index
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    save_challenge_files("3_digits", X_train, X_test, y_train, y_test, "ImageId", "Label", ACCURACY_METRIC)
except Exception as e:
    print("Digits failed:", e)

# 4. Student Dropout
try:
    # Use ID 43255 (Predict Students Dropout and Academic Success)
    dropout = fetch_openml(data_id=43255, as_frame=True, parser="auto")
    X = dropout.data
    y = dropout.target
    X['StudentId'] = X.index
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    save_challenge_files("4_student_dropout", X_train, X_test, y_train, y_test, "StudentId", "Target", F1_METRIC)
except Exception as e:
    print("Student Dropout failed:", e)

# 5. Vietnamese Sentiment (Synthetic Small Dataset)
try:
    texts = [
        "Sản phẩm này rất tốt, tôi rất thích",
        "Chất lượng quá kém, không đáng tiền",
        "Giao hàng nhanh, đóng gói cẩn thận",
        "Thái độ phục vụ tệ, sẽ không quay lại",
        "Bình thường, không có gì đặc sắc",
        "Rất tuyệt vời, 10 điểm",
        "Hàng lỗi, yêu cầu hoàn tiền",
        "Đáng đồng tiền bát gạo",
        "Tạm được so với tầm giá",
        "Quá thất vọng"
    ] * 10 # 100 rows
    sentiments = ["Positive", "Negative", "Positive", "Negative", "Neutral", "Positive", "Negative", "Positive", "Neutral", "Negative"] * 10
    
    df = pd.DataFrame({"ReviewId": range(len(texts)), "ReviewText": texts, "Sentiment": sentiments})
    X = df[["ReviewId", "ReviewText"]]
    y = df["Sentiment"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    save_challenge_files("5_vietnamese_sentiment", X_train, X_test, y_train, y_test, "ReviewId", "Sentiment", F1_METRIC)
except Exception as e:
    print("VN Sentiment failed:", e)

print("All datasets generated in challenges_data/")

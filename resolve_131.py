import os
import re

def fix_openapi():
    path = "docs/openapi.yaml"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    content = content.replace(
        "Tên metric (ví dụ ACCURACY, F1_SCORE, CUSTOM)",
        "Tên metric (ví dụ ACCURACY, F1_SCORE, LOG_LOSS, CUSTOM)"
    )
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

fix_openapi()

def fix_challenge_form():
    path = "frontend/src/views/components/admin/ChallengeForm.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    match = re.search(r"<<<<<<< HEAD.*?=======\n(.*?)\n>>>>>>> origin/main", content, flags=re.DOTALL)
    if match:
        main_block = match.group(1)
        # Add LOG_LOSS before RECALL or at the end of Tabular
        main_block = main_block.replace(
            '<option value="RECALL">',
            '<option value="LOG_LOSS">Log Loss (Thấp hơn)</option>\n                      <option value="RECALL">'
        )
        content = content[:match.start()] + main_block + content[match.end():]
        
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
            
fix_challenge_form()

def fix_scoring_tasks():
    path = "backend/app/adapters/worker/scoring_tasks.py"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Conflict 1
    content = content.replace("""<<<<<<< HEAD
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, log_loss
=======
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, recall_score
>>>>>>> origin/main""", "from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, recall_score, log_loss")

    # Conflict 2
    content = content.replace("""<<<<<<< HEAD
        score = math.sqrt(mean_squared_error(y_true, y_pred))
    elif metric_name == 'LOG_LOSS':
        score = log_loss(y_true, y_pred)
=======
        from sklearn.metrics import mean_squared_error
        try:
            y_t = [float(x) for x in y_true]
            y_p = [float(x) for x in y_pred]
        except ValueError as e:
            print(f"Lỗi ép kiểu dữ liệu sang float khi tính RMSE. Vui lòng đảm bảo các cột dự đoán chỉ chứa số. Chi tiết: {e}")
            sys.exit(1)
        score = math.sqrt(mean_squared_error(y_t, y_p))
    elif metric_name == 'RECALL':
        from sklearn.metrics import recall_score""", """        from sklearn.metrics import mean_squared_error
        try:
            y_t = [float(x) for x in y_true]
            y_p = [float(x) for x in y_pred]
        except ValueError as e:
            print(f"Lỗi ép kiểu dữ liệu sang float khi tính RMSE. Vui lòng đảm bảo các cột dự đoán chỉ chứa số. Chi tiết: {e}")
            sys.exit(1)
        score = math.sqrt(mean_squared_error(y_t, y_p))
    elif metric_name == 'LOG_LOSS':
        from sklearn.metrics import log_loss
        score = log_loss(y_true, y_pred)
    elif metric_name == 'RECALL':
        from sklearn.metrics import recall_score""")

    content = content.replace(">>>>>>> origin/main\n", "")

    # Add to ZIP block
    content = content.replace("""    elif metric_name == 'RECALL':
        score = recall_score(y_true, y_pred, average='macro', zero_division=0)""", """    elif metric_name == 'LOG_LOSS':
        from sklearn.metrics import log_loss
        score = log_loss(y_true, y_pred)
    elif metric_name == 'RECALL':
        score = recall_score(y_true, y_pred, average='macro', zero_division=0)""")

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

fix_scoring_tasks()
print("Success")

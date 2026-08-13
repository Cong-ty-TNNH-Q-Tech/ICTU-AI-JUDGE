import os
import re

def fix_challenge_form():
    path = "frontend/src/views/components/admin/ChallengeForm.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # The Vietnamese text uses composed characters `Hố` (H + o + ^ + ́). 
    # To be safe, we extract the block using regex and replace it.
    
    match = re.search(r"<<<<<<< HEAD.*?=======\n(.*?)\n>>>>>>> origin/main", content, flags=re.DOTALL)
    if match:
        main_block = match.group(1)
        # Add PRECISION before RECALL or at the end of Tabular
        main_block = main_block.replace(
            '<option value="RECALL">',
            '<option value="PRECISION">Precision (Hố trợ cao hơn)</option>\n                      <option value="RECALL">'
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
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, precision_score
=======
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, recall_score
>>>>>>> origin/main""", "from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, recall_score, precision_score")

    # Conflict 2
    content = content.replace("""<<<<<<< HEAD
        score = math.sqrt(mean_squared_error(y_true, y_pred))
    elif metric_name == 'PRECISION':
        score = precision_score(y_true, y_pred, average='macro', zero_division=0)
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
    elif metric_name == 'PRECISION':
        from sklearn.metrics import precision_score
        score = precision_score(y_true, y_pred, average='macro', zero_division=0)
    elif metric_name == 'RECALL':
        from sklearn.metrics import recall_score""")

    # Clean any leftover tags
    content = content.replace(">>>>>>> origin/main\n", "")

    # Also add PRECISION to the ZIP block which the PR missed
    # Find:
    #     elif metric_name == 'RECALL':
    #         score = recall_score(y_true, y_pred, average='macro', zero_division=0)
    # in the ZIP block (around line 550)
    content = content.replace("""    elif metric_name == 'RECALL':
        score = recall_score(y_true, y_pred, average='macro', zero_division=0)""", """    elif metric_name == 'PRECISION':
        from sklearn.metrics import precision_score
        score = precision_score(y_true, y_pred, average='macro', zero_division=0)
    elif metric_name == 'RECALL':
        score = recall_score(y_true, y_pred, average='macro', zero_division=0)""")

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

fix_scoring_tasks()
print("Success")

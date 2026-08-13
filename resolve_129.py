import os
import re

def fix_challenge_form():
    path = "frontend/src/views/components/admin/ChallengeForm.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Update the set function
    old_set_func = """  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'number' ? parseInt(value) || 0 : (value === '' && name === 'contest_id' ? null : value));
    setForm(prev => ({ ...prev, [name]: val }));
  };"""
    
    new_set_func = """  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === 'metric_name') {
      const direction = (value === 'RMSE' || value === 'MAE' || value === 'LOG_LOSS') ? 'LOWER_IS_BETTER' : 'HIGHER_IS_BETTER';
      setForm(prev => ({ ...prev, [name]: value, metric_direction: direction }));
    } else {
      const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'number' ? parseInt(value) || 0 : (value === '' && name === 'contest_id' ? null : value));
      setForm(prev => ({ ...prev, [name]: val }));
    }
  };"""
    content = content.replace(old_set_func, new_set_func)

    # 2. Add MAE to the metric dropdown
    match = re.search(r"<<<<<<< HEAD.*?=======\n(.*?)\n>>>>>>> origin/main", content, flags=re.DOTALL)
    if match:
        main_block = match.group(1)
        # Add MAE before RECALL
        main_block = main_block.replace(
            '<option value="RECALL">',
            '<option value="MAE">MAE — Mean Absolute Error (Thấp hơn)</option>\n                      <option value="RECALL">'
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
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, mean_absolute_error
=======
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, recall_score
>>>>>>> origin/main""", "from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, recall_score, mean_absolute_error")

    # Conflict 2
    content = content.replace("""<<<<<<< HEAD
        score = math.sqrt(mean_squared_error(y_true, y_pred))
    elif metric_name == 'MAE':
        score = mean_absolute_error(y_true, y_pred)
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
    elif metric_name == 'MAE':
        from sklearn.metrics import mean_absolute_error
        score = mean_absolute_error(y_true, y_pred)
    elif metric_name == 'RECALL':
        from sklearn.metrics import recall_score""")

    content = content.replace(">>>>>>> origin/main\n", "")

    # Add to ZIP block
    content = content.replace("""    elif metric_name == 'RECALL':
        score = recall_score(y_true, y_pred, average='macro', zero_division=0)""", """    elif metric_name == 'MAE':
        from sklearn.metrics import mean_absolute_error
        score = mean_absolute_error(y_true, y_pred)
    elif metric_name == 'RECALL':
        score = recall_score(y_true, y_pred, average='macro', zero_division=0)""")

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

fix_scoring_tasks()
print("Success")

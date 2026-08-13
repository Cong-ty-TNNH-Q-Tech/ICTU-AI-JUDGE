import os
import re

def resolve_dependencies():
    path = "backend/app/entrypoints/dependencies.py"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    content = content.replace("""<<<<<<< HEAD
    settings: Settings = Depends(get_settings_dep),
) -> ChallengeUseCase:
    return ChallengeUseCase(
        challenge_repo, storage_repo, tag_repo,
        zip_max_uncompressed_mb=settings.ZIP_MAX_UNCOMPRESSED_MB,
        zip_max_file_count=settings.ZIP_MAX_FILE_COUNT,
    )
=======
    uow: IUnitOfWork = Depends(get_uow),
) -> ChallengeUseCase:
    return ChallengeUseCase(challenge_repo, storage_repo, tag_repo, uow)
>>>>>>> origin/main""", """    settings: Settings = Depends(get_settings_dep),
    uow: IUnitOfWork = Depends(get_uow),
) -> ChallengeUseCase:
    return ChallengeUseCase(
        challenge_repo, storage_repo, tag_repo, uow,
        zip_max_uncompressed_mb=settings.ZIP_MAX_UNCOMPRESSED_MB,
        zip_max_file_count=settings.ZIP_MAX_FILE_COUNT,
    )""")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def resolve_challenge_use_case():
    path = "backend/app/application/use_cases/challenge_use_case.py"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
        
    content = content.replace("""<<<<<<< HEAD
        zip_max_uncompressed_mb: int = 500,
        zip_max_file_count: int = 10000,
=======
        uow: IUnitOfWork,
>>>>>>> origin/main""", """        uow: IUnitOfWork,
        zip_max_uncompressed_mb: int = 500,
        zip_max_file_count: int = 10000,""")

    content = re.sub(r"<<<<<<< HEAD\n        self\.zip_max_uncompressed_mb.*?=======\n        self\.uow = uow\n>>>>>>> origin/main", 
        "        self.zip_max_uncompressed_mb = zip_max_uncompressed_mb\n        self.zip_max_file_count = zip_max_file_count\n        self.uow = uow", 
        content, flags=re.DOTALL)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def resolve_scoring_tasks():
    path = "backend/app/adapters/worker/scoring_tasks.py"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    content = content.replace("""<<<<<<< HEAD
try:
    gt_csv_path = '/tmp/ground_truth/ground_truth.csv'
    sub_csv_path = '/tmp/submission/submission.csv'
    
    gt = pd.read_csv(gt_csv_path)
    sub = pd.read_csv(sub_csv_path)
    
=======
gt_csv_path = '/tmp/ground_truth/ground_truth.csv'
sub_csv_path = '/tmp/submission/submission.csv'

try:
    gt = pd.read_csv(gt_csv_path)
    sub = pd.read_csv(sub_csv_path)

>>>>>>> origin/main""", """try:
    gt_csv_path = '/tmp/ground_truth/ground_truth.csv'
    sub_csv_path = '/tmp/submission/submission.csv'
    
    gt = pd.read_csv(gt_csv_path)
    sub = pd.read_csv(sub_csv_path)
    """)

    content = content.replace("""<<<<<<< HEAD
    
=======

>>>>>>> origin/main""", "\n")

    content = content.replace("""<<<<<<< HEAD
    
    y_true = gt_scoring[label_col]
    y_pred = sub[label_col]
    
=======

    y_true = gt_scoring[label_col].astype(str).tolist()
    y_pred = sub[label_col].astype(str).tolist()

>>>>>>> origin/main""", """    y_true = gt_scoring[label_col].astype(str).tolist()
    y_pred = sub[label_col].astype(str).tolist()
""")

    content = re.sub(r"<<<<<<< HEAD\n        score = math\.sqrt\(mean_squared_error\(y_true, y_pred\)\).*?=======\n(.*?)>>>>>>> origin/main", 
        r"\1", 
        content, flags=re.DOTALL)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

resolve_dependencies()
resolve_challenge_use_case()
resolve_scoring_tasks()
print('Resolved')

import os
import re

def fix_router(path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove `db.commit()` lines
    # Using regex to remove `    db.commit()\n` (with indentation)
    content = re.sub(r'^[ \t]*db\.commit\(\)\n', '', content, flags=re.MULTILINE)
    
    # Remove `, db: Session = Depends(get_db)` parameter if it's there
    content = re.sub(r',\s*db:\s*Session\s*=\s*Depends\(get_db\)', '', content)
    
    # Remove `db: Session = Depends(get_db),` if it's the first parameter or followed by others
    content = re.sub(r'db:\s*Session\s*=\s*Depends\(get_db\),?\s*', '', content)
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

fix_router("backend/app/entrypoints/api/v1/challenges_router.py")
fix_router("backend/app/entrypoints/api/v1/admin_router.py")
print("Success")

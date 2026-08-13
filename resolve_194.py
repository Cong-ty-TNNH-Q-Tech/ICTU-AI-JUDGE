import os

def fix_use_case():
    path = "backend/app/application/use_cases/contest_use_case.py"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Import ChallengeStatus
    if "ChallengeStatus" not in content:
        content = content.replace(
            "from app.domain.entities.entities import ChallengeEntity, ContestEntity, ContestStatus",
            "from app.domain.entities.entities import ChallengeEntity, ContestEntity, ContestStatus, ChallengeStatus"
        )
    
    # Update logic in update
    old_status_update = """        if "status" in update_data and update_data["status"] is not None:
            entity.status = ContestStatus(update_data["status"])"""
    new_status_update = """        if "status" in update_data and update_data["status"] is not None:
            new_status = ContestStatus(update_data["status"])
            if new_status == ContestStatus.PUBLISHED and entity.status != ContestStatus.PUBLISHED:
                challenges = self._contest_repo.get_challenges(contest_id)
                published_challenges = [c for c in challenges if getattr(c, "status", None) == ChallengeStatus.PUBLISHED]
                if not published_challenges:
                    raise ValueError("Không thể publish Contest khi chưa có bài thi (Challenge) nào được PUBLISHED.")
            entity.status = new_status"""
    content = content.replace(old_status_update, new_status_update)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

fix_use_case()
print("Success")

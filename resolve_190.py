import os

def fix_dependencies():
    path = "backend/app/entrypoints/dependencies.py"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # We need to inject challenge_repo into get_contest_use_case
    old = """def get_contest_use_case(
    contest_repo: IContestRepository = Depends(get_contest_repository),
    uow: IUnitOfWork = Depends(get_uow),
) -> ContestUseCase:
    return ContestUseCase(contest_repo, uow)"""
    new = """def get_contest_use_case(
    contest_repo: IContestRepository = Depends(get_contest_repository),
    challenge_repo: IChallengeRepository = Depends(get_challenge_repository),
    uow: IUnitOfWork = Depends(get_uow),
) -> ContestUseCase:
    return ContestUseCase(contest_repo, challenge_repo, uow)"""
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def fix_use_case():
    path = "backend/app/application/use_cases/contest_use_case.py"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Import IChallengeRepository if needed
    if "IChallengeRepository" not in content:
        content = content.replace(
            "from app.application.interfaces.repositories import IContestRepository, IUnitOfWork",
            "from app.application.interfaces.repositories import IContestRepository, IChallengeRepository, IUnitOfWork"
        )
    
    # Update __init__
    old_init = """    def __init__(self, contest_repo: IContestRepository, uow: IUnitOfWork):
        self._contest_repo = contest_repo
        self._uow = uow"""
    new_init = """    def __init__(self, contest_repo: IContestRepository, challenge_repo: IChallengeRepository, uow: IUnitOfWork):
        self._contest_repo = contest_repo
        self._challenge_repo = challenge_repo
        self._uow = uow"""
    content = content.replace(old_init, new_init)

    # Update delete
    old_delete = """    def delete(self, contest_id: uuid.UUID) -> None:
        \"\"\"Soft delete — kiểm tra tồn tại trước, sau đó đặt deleted_at.\"\"\"
        entity = self._contest_repo.get_by_id(contest_id)
        if not entity:
            raise NotFoundError(f"Contest {contest_id} không tồn tại.")
        self._contest_repo.delete(contest_id)
        self._uow.commit()
        logger.info("Contest soft-deleted: id=%s", contest_id)"""
    new_delete = """    def delete(self, contest_id: uuid.UUID) -> None:
        \"\"\"Soft delete — kiểm tra tồn tại trước, sau đó đặt deleted_at.\"\"\"
        entity = self._contest_repo.get_by_id(contest_id)
        if not entity:
            raise NotFoundError(f"Contest {contest_id} không tồn tại.")
        self._contest_repo.delete(contest_id)
        
        # Cascade soft-delete cho các challenge con
        challenges = self._contest_repo.get_challenges(contest_id)
        for c in challenges:
            self._challenge_repo.soft_delete(c.id)
            
        self._uow.commit()
        logger.info("Contest soft-deleted with %d child challenges: id=%s", len(challenges), contest_id)"""
    content = content.replace(old_delete, new_delete)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def fix_tests():
    path = "backend/tests/application/use_cases/test_contest_use_case.py"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    old_mock = "    return ContestUseCase(contest_repo=repo, uow=uow)"
    new_mock = """    challenge_repo = MagicMock()
    return ContestUseCase(contest_repo=repo, challenge_repo=challenge_repo, uow=uow)"""
    content = content.replace(old_mock, new_mock)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

fix_dependencies()
fix_use_case()
fix_tests()
print("Success")

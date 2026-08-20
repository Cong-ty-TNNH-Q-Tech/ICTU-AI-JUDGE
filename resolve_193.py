import os
import re

def fix_dependencies():
    path = "backend/app/entrypoints/dependencies.py"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Import IContestRepository if not imported
    if "from app.application.interfaces.repositories import (" in content and "IContestRepository," not in content:
        content = content.replace(
            "from app.application.interfaces.repositories import (",
            "from app.application.interfaces.repositories import (\n    IContestRepository,"
        )

    # get_contest_use_case
    old = """def get_challenge_use_case(
    challenge_repo: IChallengeRepository = Depends(get_challenge_repository),
    storage_repo: IStorageRepository = Depends(get_storage_repository),
    tag_repo: ITagRepository = Depends(get_tag_repository),
    uow: IUnitOfWork = Depends(get_uow),
) -> ChallengeUseCase:
    return ChallengeUseCase(challenge_repo, storage_repo, tag_repo, uow)"""
    new = """def get_challenge_use_case(
    challenge_repo: IChallengeRepository = Depends(get_challenge_repository),
    storage_repo: IStorageRepository = Depends(get_storage_repository),
    tag_repo: ITagRepository = Depends(get_tag_repository),
    contest_repo: IContestRepository = Depends(get_contest_repository),
    uow: IUnitOfWork = Depends(get_uow),
) -> ChallengeUseCase:
    return ChallengeUseCase(challenge_repo, storage_repo, tag_repo, contest_repo, uow)"""
    if old in content:
        content = content.replace(old, new)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

fix_dependencies()

def fix_use_case():
    path = "backend/app/application/use_cases/challenge_use_case.py"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Imports
    content = content.replace(
        "from app.application.interfaces.repositories import IChallengeRepository, IStorageRepository, ITagRepository, IUnitOfWork",
        "from app.application.interfaces.repositories import IChallengeRepository, IStorageRepository, ITagRepository, IUnitOfWork, IContestRepository"
    )

    # Init
    old_init = """    def __init__(
        self,
        challenge_repo: IChallengeRepository,
        storage_repo: IStorageRepository,
        tag_repo: ITagRepository,
        uow: IUnitOfWork,
    ):
        self.challenge_repo = challenge_repo
        self.storage_repo = storage_repo
        self.tag_repo = tag_repo
        self.uow = uow"""
    new_init = """    def __init__(
        self,
        challenge_repo: IChallengeRepository,
        storage_repo: IStorageRepository,
        tag_repo: ITagRepository,
        contest_repo: IContestRepository,
        uow: IUnitOfWork,
    ):
        self.challenge_repo = challenge_repo
        self.storage_repo = storage_repo
        self.tag_repo = tag_repo
        self.contest_repo = contest_repo
        self.uow = uow"""
    content = content.replace(old_init, new_init)

    # create_challenge
    old_create = """        if data.tag_ids:
            tags = self.tag_repo.get_by_ids(data.tag_ids)
            if len(tags) != len(data.tag_ids):
                raise ValueError("Một số tags không tồn tại.")
            new_entity.tags = tags

        saved = self.challenge_repo.save(new_entity)
        self.uow.commit()"""
    new_create = """        if data.tag_ids:
            tags = self.tag_repo.get_by_ids(data.tag_ids)
            if len(tags) != len(data.tag_ids):
                raise ValueError("Một số tags không tồn tại.")
            new_entity.tags = tags

        if data.contest_id:
            contest = self.contest_repo.get_by_id(data.contest_id)
            if not contest:
                raise ValueError("Contest không tồn tại.")
            if new_entity.start_time < contest.start_time:
                raise ValueError("Thời gian bắt đầu của Challenge không được trước thời gian bắt đầu của Contest.")
            if contest.end_time:
                if not new_entity.end_time or new_entity.end_time > contest.end_time:
                    raise ValueError("Thời gian kết thúc của Challenge không được vượt quá thời gian kết thúc của Contest.")

        saved = self.challenge_repo.save(new_entity)
        self.uow.commit()"""
    content = content.replace(old_create, new_create)

    # update_challenge
    old_update = """        if data.tag_ids is not None:
            if not data.tag_ids:
                challenge.tags = []
            else:
                tags = self.tag_repo.get_by_ids(data.tag_ids)
                if len(tags) != len(data.tag_ids):
                    raise ValueError("Một số tags không tồn tại.")
                challenge.tags = tags

        updated = self.challenge_repo.update(challenge)
        self.uow.commit()"""
    new_update = """        if data.tag_ids is not None:
            if not data.tag_ids:
                challenge.tags = []
            else:
                tags = self.tag_repo.get_by_ids(data.tag_ids)
                if len(tags) != len(data.tag_ids):
                    raise ValueError("Một số tags không tồn tại.")
                challenge.tags = tags

        if challenge.contest_id:
            contest = self.contest_repo.get_by_id(challenge.contest_id)
            if not contest:
                raise ValueError("Contest không tồn tại.")
            if challenge.start_time < contest.start_time:
                raise ValueError("Thời gian bắt đầu của Challenge không được trước thời gian bắt đầu của Contest.")
            if contest.end_time:
                if not challenge.end_time or challenge.end_time > contest.end_time:
                    raise ValueError("Thời gian kết thúc của Challenge không được vượt quá thời gian kết thúc của Contest.")

        updated = self.challenge_repo.update(challenge)
        self.uow.commit()"""
    content = content.replace(old_update, new_update)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

fix_use_case()

def fix_tests():
    path = "backend/tests/application/use_cases/test_challenge_use_case.py"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    old_mock = "return ChallengeUseCase(challenge_repo=repo, storage_repo=storage_repo, tag_repo=tag_repo, uow=uow)"
    new_mock = """contest_repo = MagicMock()
    return ChallengeUseCase(
        challenge_repo=repo, 
        storage_repo=storage_repo, 
        tag_repo=tag_repo, 
        contest_repo=contest_repo,
        uow=uow
    )"""
    if old_mock in content:
        content = content.replace(old_mock, new_mock)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

fix_tests()
print("Success")

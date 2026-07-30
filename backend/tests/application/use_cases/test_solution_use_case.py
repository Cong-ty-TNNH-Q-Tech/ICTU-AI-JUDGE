import uuid
from unittest.mock import MagicMock
import pytest
import datetime

from app.application.use_cases.solution_use_case import SolutionUseCase
from app.domain.entities.entities import ChallengeStatus, SolutionEntity, UserEntity, UserRole

@pytest.fixture
def solution_use_case():
    solution_repo = MagicMock()
    storage_repo = MagicMock()
    challenge_repo = MagicMock()
    user_repo = MagicMock()
    return SolutionUseCase(solution_repo, storage_repo, challenge_repo, user_repo)

def test_list_solutions_success(solution_use_case):
    challenge = MagicMock()
    solution_use_case._challenge_repo.get_by_id.return_value = challenge
    
    sol = SolutionEntity(
        id=uuid.uuid4(),
        challenge_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        title="Title",
        content="Content",
        notebook_url="solutions/key.ipynb",
        upvotes=1,
        created_at=datetime.datetime.now()
    )
    solution_use_case._solution_repo.list_by_challenge.return_value = [sol]
    solution_use_case._storage_repo.get_download_url.return_value = "http://presigned"
    mock_user = MagicMock()
    mock_user.full_name = "Test User"
    solution_use_case._user_repo.get_by_id.return_value = mock_user
    
    res = solution_use_case.list_solutions(uuid.uuid4())
    assert res.total == 1
    assert len(res.items) == 1
    assert res.items[0].notebook_url == "http://presigned"

def test_list_solutions_not_found(solution_use_case):
    solution_use_case._challenge_repo.get_by_id.return_value = None
    with pytest.raises(ValueError, match="không tồn tại"):
        solution_use_case.list_solutions(uuid.uuid4())

def test_publish_solution_success(solution_use_case):
    challenge = MagicMock()
    challenge.status = ChallengeStatus.PUBLISHED
    solution_use_case._challenge_repo.get_by_id.return_value = challenge
    
    user = UserEntity(
        id=uuid.uuid4(),
        email="test@test.com",
        student_id="123",
        full_name="Name",
        role=UserRole.STUDENT,
        password_hash="",
        created_at=datetime.datetime.now(),
        updated_at=datetime.datetime.now()
    )
    
    solution_use_case._storage_repo.get_download_url.return_value = "http://presigned"
    
    def mock_save(s):
        return s
    solution_use_case._solution_repo.save.side_effect = mock_save
    
    res = solution_use_case.publish_solution(user, uuid.uuid4(), "title", "content", b"bytes", "test.ipynb")
    assert res.title == "title"
    assert res.notebook_url == "http://presigned"
    solution_use_case._storage_repo.upload.assert_called_once()
    solution_use_case._solution_repo.save.assert_called_once()

def test_publish_solution_invalid_file(solution_use_case):
    challenge = MagicMock()
    challenge.status = ChallengeStatus.PUBLISHED
    solution_use_case._challenge_repo.get_by_id.return_value = challenge
    
    user = MagicMock()
    with pytest.raises(ValueError, match="Chỉ hỗ trợ file Jupyter Notebook"):
        solution_use_case.publish_solution(user, uuid.uuid4(), "title", "content", b"bytes", "test.txt")

def test_publish_solution_not_published(solution_use_case):
    challenge = MagicMock()
    challenge.status = ChallengeStatus.DRAFT
    solution_use_case._challenge_repo.get_by_id.return_value = challenge
    
    user = MagicMock()
    with pytest.raises(ValueError, match="Chỉ có thể chia sẻ giải pháp"):
        solution_use_case.publish_solution(user, uuid.uuid4(), "title", "content", b"bytes", "test.ipynb")

def test_upvote_solution_success(solution_use_case):
    sol = SolutionEntity(
        id=uuid.uuid4(),
        challenge_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        title="Title",
        content="Content",
        notebook_url="solutions/key.ipynb",
        upvotes=1,
        created_at=datetime.datetime.now()
    )
    solution_use_case._solution_repo.upvote.return_value = sol
    solution_use_case._storage_repo.get_download_url.return_value = "http://presigned"
    mock_user = MagicMock()
    mock_user.full_name = "Test User"
    solution_use_case._user_repo.get_by_id.return_value = mock_user
    
    res = solution_use_case.upvote_solution(uuid.uuid4(), uuid.uuid4())
    assert res.upvotes == 1

def test_upvote_solution_not_found(solution_use_case):
    solution_use_case._solution_repo.upvote.return_value = None
    with pytest.raises(LookupError, match="không tồn tại"):
        solution_use_case.upvote_solution(uuid.uuid4(), uuid.uuid4())

import uuid
import pytest
from datetime import datetime
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import create_engine

from app.adapters.database.leaderboard_repository import SQLLeaderboardRepository
from app.adapters.database.models import LeaderboardModel, TeamModel, ChallengeModel, SubmissionModel, UserModel
from app.domain.entities.entities import MetricDirection
from app.core.database import Base

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    yield session
    session.close()


def test_list_public_includes_entries_count(db_session: Session):
    repo = SQLLeaderboardRepository(db_session)
    
    # Setup test data
    user = UserModel(email="test@test.com", password_hash="123", full_name="Test", student_id="sv1")
    db_session.add(user)
    db_session.commit()
    
    challenge = ChallengeModel(
        title="Test Challenge",
        description="desc",
        type="PUBLIC",
        start_time=datetime.now(),
        end_time=datetime.now(),
        metric_name="accuracy",
        metric_direction=MetricDirection.HIGHER_IS_BETTER.value,
        created_by=user.id
    )
    db_session.add(challenge)
    db_session.commit()
    
    team = TeamModel(name="Test Team", challenge_id=challenge.id, leader_id=user.id)
    db_session.add(team)
    db_session.commit()
    
    lb = LeaderboardModel(
        challenge_id=challenge.id,
        team_id=team.id,
        best_public_score=0.9,
        last_submission_time=datetime.now()
    )
    db_session.add(lb)
    db_session.commit()
    
    # Add 3 submissions for this team and challenge
    for _ in range(3):
        sub = SubmissionModel(
            challenge_id=challenge.id,
            team_id=team.id,
            submitted_by=user.id,
            file_md5_hash=uuid.uuid4().hex,
            file_size_bytes=100
        )
        db_session.add(sub)
    db_session.commit()
    
    # Execute
    results, total = repo.list_public(challenge.id, page=1, size=10)
    
    # Assert
    assert total == 1
    assert len(results) == 1
    
    entry, team_name = results[0]
    assert team_name == "Test Team"
    assert entry.entries == 3
    assert entry.best_public_score == 0.9

def test_list_private_includes_entries_count(db_session: Session):
    repo = SQLLeaderboardRepository(db_session)
    
    # Setup test data
    user = UserModel(email="test2@test.com", password_hash="123", full_name="Test 2", student_id="sv2")
    db_session.add(user)
    db_session.commit()
    
    challenge = ChallengeModel(
        title="Test Challenge Private",
        description="desc",
        type="PUBLIC",
        start_time=datetime.now(),
        end_time=datetime.now(),
        metric_name="accuracy",
        metric_direction=MetricDirection.HIGHER_IS_BETTER.value,
        created_by=user.id
    )
    db_session.add(challenge)
    db_session.commit()
    
    team = TeamModel(name="Test Team Private", challenge_id=challenge.id, leader_id=user.id)
    db_session.add(team)
    db_session.commit()
    
    lb = LeaderboardModel(
        challenge_id=challenge.id,
        team_id=team.id,
        best_public_score=0.8,
        best_private_score=0.95,
        last_submission_time=datetime.now()
    )
    db_session.add(lb)
    db_session.commit()
    
    # Add 2 submissions
    for _ in range(2):
        sub = SubmissionModel(
            challenge_id=challenge.id,
            team_id=team.id,
            submitted_by=user.id,
            file_md5_hash=uuid.uuid4().hex,
            file_size_bytes=100
        )
        db_session.add(sub)
    db_session.commit()
    
    # Execute
    results, total = repo.list_private(challenge.id, page=1, size=10)
    
    # Assert
    assert total == 1
    assert len(results) == 1
    
    entry, team_name = results[0]
    assert team_name == "Test Team Private"
    assert entry.entries == 2
    assert entry.best_private_score == 0.95

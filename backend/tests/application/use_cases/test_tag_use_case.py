import uuid
from unittest.mock import MagicMock
from datetime import datetime
import pytest

from app.application.use_cases.tag_use_case import TagUseCase
from app.application.dtos.tag_dtos import TagCreateRequestDTO, TagUpdateRequestDTO
from app.domain.entities.entities import TagEntity
from app.domain.exceptions.exceptions import NotFoundError, DomainException

@pytest.fixture
def uow_mock():
    return MagicMock()

@pytest.fixture
def tag_repo_mock():
    return MagicMock()

@pytest.fixture
def tag_use_case(uow_mock, tag_repo_mock):
    return TagUseCase(uow=uow_mock, tag_repo=tag_repo_mock)

@pytest.fixture
def dummy_tag():
    return TagEntity(
        id=uuid.uuid4(),
        name="NLP",
        color_hex="#123456",
        created_at=datetime.now()
    )

def test_list_tags(tag_use_case, tag_repo_mock, dummy_tag):
    tag_repo_mock.list_all.return_value = [dummy_tag]
    
    result = tag_use_case.list_tags()
    assert len(result) == 1
    assert result[0].name == "NLP"
    tag_repo_mock.list_all.assert_called_once()

def test_create_tag_success(tag_use_case, tag_repo_mock, uow_mock, dummy_tag):
    tag_repo_mock.get_by_name.return_value = None
    tag_repo_mock.save.return_value = dummy_tag
    
    dto = TagCreateRequestDTO(name="NLP", color_hex="#123456")
    result = tag_use_case.create_tag(dto)
    
    assert result.name == "NLP"
    tag_repo_mock.save.assert_called_once()
    uow_mock.commit.assert_called_once()

def test_create_tag_duplicate_name(tag_use_case, tag_repo_mock, dummy_tag):
    tag_repo_mock.get_by_name.return_value = dummy_tag
    
    dto = TagCreateRequestDTO(name="NLP", color_hex="#123456")
    with pytest.raises(ValueError):
        tag_use_case.create_tag(dto)

def test_update_tag_success(tag_use_case, tag_repo_mock, uow_mock, dummy_tag):
    tag_repo_mock.get_by_id.return_value = dummy_tag
    tag_repo_mock.get_by_name.return_value = None
    tag_repo_mock.update.return_value = dummy_tag
    
    dto = TagUpdateRequestDTO(name="CV")
    result = tag_use_case.update_tag(dummy_tag.id, dto)
    
    assert result.name == "CV"
    tag_repo_mock.update.assert_called_once()
    uow_mock.commit.assert_called_once()

def test_update_tag_not_found(tag_use_case, tag_repo_mock):
    tag_repo_mock.get_by_id.return_value = None
    
    dto = TagUpdateRequestDTO(name="CV")
    with pytest.raises(NotFoundError):
        tag_use_case.update_tag(uuid.uuid4(), dto)

def test_delete_tag_success(tag_use_case, tag_repo_mock, uow_mock, dummy_tag):
    tag_repo_mock.get_by_id.return_value = dummy_tag
    
    tag_use_case.delete_tag(dummy_tag.id)
    
    tag_repo_mock.delete.assert_called_once_with(dummy_tag.id)
    uow_mock.commit.assert_called_once()

def test_delete_tag_not_found(tag_use_case, tag_repo_mock):
    tag_repo_mock.get_by_id.return_value = None
    
    with pytest.raises(NotFoundError):
        tag_use_case.delete_tag(uuid.uuid4())

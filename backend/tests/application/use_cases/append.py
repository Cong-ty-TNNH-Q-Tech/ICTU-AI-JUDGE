def test_submit_prediction_redis_failure(use_case, mock_repos, mock_challenge, mock_team):
    mock_repos['team_repo'].get_by_challenge_and_user.return_value = mock_team
    mock_repos['challenge_repo'].get_by_id.return_value = mock_challenge
    mock_repos['submission_repo'].get_last_submission_time.return_value = None
    mock_repos['submission_repo'].exists_by_hash.return_value = False
    mock_repos['message_broker'].enqueue_scoring_task.side_effect = Exception('Redis Down')
    result = use_case.submit_prediction(
        challenge_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        file_bytes=b'1,1\n2,2',
        filename='sub.csv',
        content_type='text/csv'
    )
    assert result.submission_id is not None

def test_select_for_private_success(use_case, mock_repos, mock_challenge, mock_team):
    sub_id = uuid.uuid4()
    mock_sub = MagicMock()
    mock_sub.team_id = mock_team.id
    mock_sub.challenge_id = mock_challenge.id
    mock_repos['submission_repo'].get_by_id.return_value = mock_sub
    mock_repos['team_repo'].get_by_id.return_value = mock_team
    mock_team.has_member = MagicMock(return_value=True)
    mock_repos['challenge_repo'].get_by_id.return_value = mock_challenge
    mock_challenge.end_time = datetime.now(timezone.utc) + timedelta(days=1)
    res = use_case.select_for_private(sub_id, uuid.uuid4())
    assert res.is_selected_for_private is True

def test_select_for_private_not_found(use_case, mock_repos):
    mock_repos['submission_repo'].get_by_id.return_value = None
    with pytest.raises(NotFoundError):
        use_case.select_for_private(uuid.uuid4(), uuid.uuid4())

def test_select_for_private_not_member(use_case, mock_repos, mock_team):
    mock_sub = MagicMock()
    mock_sub.team_id = mock_team.id
    mock_repos['submission_repo'].get_by_id.return_value = mock_sub
    mock_repos['team_repo'].get_by_id.return_value = mock_team
    mock_team.has_member = MagicMock(return_value=False)
    with pytest.raises(PermissionDeniedError):
        use_case.select_for_private(uuid.uuid4(), uuid.uuid4())

def test_select_for_private_deadline_passed(use_case, mock_repos, mock_challenge, mock_team):
    mock_sub = MagicMock()
    mock_sub.team_id = mock_team.id
    mock_sub.challenge_id = mock_challenge.id
    mock_repos['submission_repo'].get_by_id.return_value = mock_sub
    mock_repos['team_repo'].get_by_id.return_value = mock_team
    mock_team.has_member = MagicMock(return_value=True)
    mock_repos['challenge_repo'].get_by_id.return_value = mock_challenge
    mock_challenge.end_time = datetime.now(timezone.utc) - timedelta(days=1)
    with pytest.raises(SubmissionDeadlinePassedError):
        use_case.select_for_private(uuid.uuid4(), uuid.uuid4())

def test_upload_source_code_success(use_case, mock_repos, mock_challenge, mock_team):
    sub_id = uuid.uuid4()
    mock_sub = MagicMock()
    mock_sub.team_id = mock_team.id
    mock_sub.challenge_id = mock_challenge.id
    mock_repos['submission_repo'].get_by_id.return_value = mock_sub
    mock_repos['team_repo'].get_by_id.return_value = mock_team
    mock_team.has_member = MagicMock(return_value=True)
    mock_repos['challenge_repo'].get_by_id.return_value = mock_challenge
    mock_challenge.end_time = datetime.now(timezone.utc) - timedelta(days=1)
    mock_repos['storage_repo'].upload.return_value = 'http://s3/file.zip'
    res = use_case.upload_source_code(sub_id, uuid.uuid4(), b'abc', 'file.zip', 'application/zip')
    assert res.message == "Upload source code thành công."

def test_upload_source_code_not_found(use_case, mock_repos):
    mock_repos['submission_repo'].get_by_id.return_value = None
    with pytest.raises(NotFoundError):
        use_case.upload_source_code(uuid.uuid4(), uuid.uuid4(), b'abc', 'file.zip', 'application/zip')

def test_list_team_submissions_success(use_case, mock_repos, mock_team):
    mock_repos['team_repo'].get_by_challenge_and_user.return_value = mock_team
    from app.domain.entities.entities import SubmissionEntity, SubmissionStatus
    mock_sub = SubmissionEntity(
        id=uuid.uuid4(),
        challenge_id=uuid.uuid4(),
        team_id=mock_team.id,
        submitted_by=uuid.uuid4(),
        file_md5_hash="hash",
        file_size_bytes=10,
        status=SubmissionStatus.PENDING,
        submitted_at=datetime.now(timezone.utc)
    )
    mock_repos['submission_repo'].list_by_team.return_value = ([mock_sub], 1)
    res = use_case.list_team_submissions(uuid.uuid4(), uuid.uuid4(), 1, 10)
    assert res.total_count == 1
    assert len(res.data) == 1

def test_list_team_submissions_no_team(use_case, mock_repos):
    mock_repos['team_repo'].get_by_challenge_and_user.return_value = None
    with pytest.raises(PermissionDeniedError):
        use_case.list_team_submissions(uuid.uuid4(), uuid.uuid4(), 1, 10)

def test_validate_csv_format_invalid_extension():
    from app.application.use_cases.submission_use_case import _validate_csv_format
    with pytest.raises(ValueError, match="Chỉ chấp nhận file định dạng .csv"):
        _validate_csv_format(b'a,b\n1,2', 'test.txt')

def test_validate_csv_format_not_enough_rows():
    from app.application.use_cases.submission_use_case import _validate_csv_format
    with pytest.raises(ValueError, match="File CSV cần có ít nhất 1 dòng"):
        _validate_csv_format(b'header', 'test.csv')

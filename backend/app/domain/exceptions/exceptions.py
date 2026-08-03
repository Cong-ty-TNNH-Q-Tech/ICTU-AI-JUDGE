"""
Domain Exceptions — Custom exception classes cho nghiệp vụ.
Use Cases raise các exception này; Router bắt và map sang HTTP status code.
"""


class DomainException(Exception):
    """Base exception cho mọi lỗi nghiệp vụ."""
    pass


class SubmissionDeadlinePassedError(DomainException):
    """Nộp bài ngoài cửa sổ thời gian cho phép."""
    pass


class RateLimitExceededError(DomainException):
    """Vi phạm giới hạn khoảng cách giữa 2 lần nộp."""

    def __init__(self, wait_minutes: int):
        self.wait_minutes = wait_minutes
        super().__init__(f"Vui lòng chờ {wait_minutes} phút nữa để nộp lần tiếp theo.")


class PasswordResetRateLimitError(RateLimitExceededError):
    """Yêu cầu đặt lại mật khẩu quá nhiều lần."""
    def __init__(self, wait_minutes: int):
        self.wait_minutes = wait_minutes
        DomainException.__init__(self, f"Vui lòng chờ {wait_minutes} phút nữa để yêu cầu đặt lại mật khẩu lần tiếp theo.")


class DuplicateSubmissionError(DomainException):
    """File CSV trùng MD5 Hash với lần nộp trước."""
    pass


class FileSizeExceededError(DomainException):
    """File upload vượt quá giới hạn dung lượng của bài thi."""

    def __init__(self, max_mb: int | str):
        if isinstance(max_mb, int):
            self.max_mb = max_mb
            super().__init__(f"Dung lượng file vượt quá giới hạn {max_mb}MB.")
        else:
            # Cho phép truyền message string trực tiếp (VD: UC06 source code upload)
            self.max_mb = None
            super().__init__(max_mb)


class TeamAlreadyLockedError(DomainException):
    """Đã qua deadline khóa đội — không được thêm/xóa thành viên."""
    pass


class TeamHasSubmissionsError(DomainException):
    """Không thể kick thành viên vì đội đã có lịch sử nộp bài."""
    pass


class UserAlreadyInTeamError(DomainException):
    """Người được mời đã thuộc một đội khác trong cùng bài thi."""
    pass


class TeamFullError(DomainException):
    """Đội đã đủ số lượng thành viên tối đa."""
    pass


class MetricLockedError(DomainException):
    """Không thể thay đổi metric/ground truth khi đã có submission thành công."""
    pass


class NotFoundError(DomainException):
    """Entity không tồn tại."""
    pass


class PermissionDeniedError(DomainException):
    """Không có quyền thực hiện thao tác này."""
    pass


class AuthenticationError(DomainException):
    """Thông tin xác thực không hợp lệ."""
    pass


class InvalidTokenError(DomainException):
    """Mã xác nhận hoặc token không hợp lệ hoặc đã hết hạn."""
    pass


class InvalidPasswordError(DomainException):
    """Mật khẩu cũ không chính xác."""
    pass

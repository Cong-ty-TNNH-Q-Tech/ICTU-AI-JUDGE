"""
Auth DTOs — Request/Response schemas cho API Authentication.
"""
from pydantic import BaseModel, EmailStr, Field


class ChangePasswordRequestDTO(BaseModel):
    old_password: str = Field(..., min_length=1, description="Mật khẩu hiện tại")
    new_password: str = Field(..., min_length=8, description="Mật khẩu mới (ít nhất 8 ký tự)")


class ForgotPasswordRequestDTO(BaseModel):
    email: EmailStr = Field(..., description="Email đăng nhập của tài khoản")


class ResetPasswordRequestDTO(BaseModel):
    token: str = Field(..., description="Token đặt lại mật khẩu")
    new_password: str = Field(..., min_length=8, description="Mật khẩu mới (ít nhất 8 ký tự)")


class LoginRequestDTO(BaseModel):
    email: EmailStr = Field(..., description="Email đăng nhập")
    password: str = Field(..., min_length=1, description="Mật khẩu")


class RegisterRequestDTO(BaseModel):
    email: EmailStr = Field(..., description="Email đăng ký")
    password: str = Field(..., min_length=8, description="Mật khẩu")
    full_name: str = Field(..., min_length=1, description="Họ và tên")
    student_id: str = Field(..., description="Mã sinh viên")


class VerifyOTPRequestDTO(BaseModel):
    email: EmailStr = Field(..., description="Email đăng ký")
    otp: str = Field(..., min_length=6, max_length=6, description="Mã OTP")

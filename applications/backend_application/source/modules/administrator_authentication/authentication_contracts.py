"""Pydantic contracts for administrator authentication operations."""

from pydantic import BaseModel, EmailStr, Field


class AdministratorLoginRequest(BaseModel):
    """Request to authenticate an administrator with email and password."""

    email: str = Field(..., description="Administrator email address")
    password: str = Field(..., min_length=1, description="Plain text password")


class AuthenticationTokensResponse(BaseModel):
    """Successful authentication response containing JWT tokens."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_account_id: str
    email: str
    full_name: str
    role: str
    organization_id: str
    must_change_password: bool


class RefreshTokenRequest(BaseModel):
    """Request to refresh an expired access token."""

    refresh_token: str = Field(..., description="Valid refresh token")


class ChangeAdministratorPasswordRequest(BaseModel):
    """Request to replace the authenticated administrator password."""

    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)


class ChangeAdministratorPasswordResponse(BaseModel):
    """Response returned after a password is changed."""

    message: str
    must_change_password: bool = False

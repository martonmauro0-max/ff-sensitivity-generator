from pydantic import BaseModel, EmailStr


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class AdminLoginResponse(BaseModel):
    message: str
    admin_id: int
    name: str
    email: EmailStr
    role: str


class AdminUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    password: str | None = None
    role: str | None = None
    is_active: bool | None = None

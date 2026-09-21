from sqlalchemy.orm import Session

from backend.admin_models import AdminUser
from backend.admin_security import verify_password


def authenticate_admin(
    db: Session,
    email: str,
    password: str
):
    admin = (
        db.query(AdminUser)
        .filter(AdminUser.email == email.lower().strip())
        .first()
    )

    if admin is None:
        return None

    if not admin.is_active:
        return None

    if not verify_password(password, admin.password_hash):
        return None

    return admin

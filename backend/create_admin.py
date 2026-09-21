from getpass import getpass
from datetime import datetime, timezone

from backend.database import SessionLocal
from backend.admin_models import AdminUser
from backend.auth import hash_password

db = SessionLocal()

try:
    email = input("Email do Super Admin: ").strip()
    name = input("Nome do Super Admin: ").strip()
    password = getpass("Senha: ")
    confirm = getpass("Confirmar senha: ")

    if not email or not name:
        raise SystemExit("ERRO: nome e email sao obrigatorios.")

    if password != confirm:
        raise SystemExit("ERRO: as senhas nao coincidem.")

    if len(password) < 8:
        raise SystemExit("ERRO: a senha deve ter pelo menos 8 caracteres.")

    existing = db.query(AdminUser).filter(
        AdminUser.email == email
    ).first()

    if existing:
        raise SystemExit("ERRO: ja existe um administrador com esse email.")

    now = datetime.now(timezone.utc).isoformat()

    admin = AdminUser(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role="Super Admin",
        is_active=True,
        created_at=now,
        updated_at=now,
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    print("SUPER ADMIN CRIADO COM SUCESSO")
    print("ID:", admin.id)
    print("Email:", admin.email)
    print("Funcao:", admin.role)

finally:
    db.close()

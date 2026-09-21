from getpass import getpass

from backend.database import SessionLocal
from backend.admin_models import AdminUser
from backend.auth import hash_password


db = SessionLocal()

try:
    email = "anuelmauro3@gmail.com"

    admin = db.query(AdminUser).filter(
        AdminUser.email == email
    ).first()

    if not admin:
        raise SystemExit("ERRO: Super Admin não encontrado.")

    password = getpass("Nova senha: ")
    confirm = getpass("Confirmar nova senha: ")

    if password != confirm:
        raise SystemExit("ERRO: as senhas não coincidem.")

    if len(password) < 8:
        raise SystemExit("ERRO: a senha deve ter pelo menos 8 caracteres.")

    admin.password_hash = hash_password(password)
    db.commit()

    print("SENHA DO SUPER ADMIN ATUALIZADA COM SUCESSO")
    print("Email:", admin.email)
    print("Função:", admin.role)

finally:
    db.close()

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.admin_models import AdminUser
from backend.admin_schemas import AdminUpdate
from backend.admin_logs import create_admin_log
from backend.generation_models import GenerationLog
from backend.auth import (
    create_access_token,
    hash_password,
    verify_password,
    get_current_admin,
    require_roles,
)

router = APIRouter(prefix="/api/admin", tags=["Admin"])


class AdminLogin(BaseModel):
    email: str
    password: str


class AdminCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "Admin"


@router.post("/setup")
def setup_admin(data: AdminCreate, db: Session = Depends(get_db)):
    if db.query(AdminUser).count() > 0:
        raise HTTPException(
            status_code=403,
            detail="Admin já configurado"
        )

    if data.role not in ["Super Admin", "Admin", "Editor", "Moderador"]:
        raise HTTPException(
            status_code=400,
            detail="Função inválida"
        )

    if len(data.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="A senha deve ter pelo menos 8 caracteres"
        )

    now = datetime.now(timezone.utc).isoformat()

    admin = AdminUser(
        name=data.name.strip(),
        email=data.email.lower().strip(),
        password_hash=hash_password(data.password),
        role="Super Admin",
        is_active=True,
        created_at=now,
        updated_at=now,
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    return {
        "message": "Super Admin criado com sucesso",
        "id": admin.id,
        "name": admin.name,
        "email": admin.email,
        "role": admin.role,
    }


@router.post("/login")
def login(data: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(
        AdminUser.email == data.email.lower().strip()
    ).first()

    if not admin or not verify_password(
        data.password,
        admin.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta de administrador desativada"
        )

    token = create_access_token(admin.id)

    return {
        "message": "Login realizado com sucesso",
        "access_token": token,
        "token_type": "bearer",
        "id": admin.id,
        "name": admin.name,
        "email": admin.email,
        "role": admin.role,
    }


@router.get("/me")
def get_me(
    admin: AdminUser = Depends(get_current_admin),
):
    return {
        "id": admin.id,
        "name": admin.name,
        "email": admin.email,
        "role": admin.role,
        "is_active": admin.is_active,
    }


@router.get("/dashboard")
def dashboard(
    admin: AdminUser = Depends(
        require_roles("Super Admin", "Admin")
    ),
    db: Session = Depends(get_db),
):
    total_admins = db.query(AdminUser).count()
    active_admins = db.query(AdminUser).filter(
        AdminUser.is_active == True
    ).count()

    return {
        "message": "Dashboard Admin",
        "admin": {
            "id": admin.id,
            "name": admin.name,
            "role": admin.role,
        },
        "statistics": {
            "total_admins": total_admins,
            "active_admins": active_admins,
        },
    }


@router.get("/admins")
def list_admins(
    admin: AdminUser = Depends(
        require_roles("Super Admin")
    ),
    db: Session = Depends(get_db),
):
    admins = db.query(AdminUser).order_by(
        AdminUser.id.asc()
    ).all()

    return [
        {
            "id": item.id,
            "name": item.name,
            "email": item.email,
            "role": item.role,
            "is_active": item.is_active,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        }
        for item in admins
    ]


@router.post("/admins")
def create_admin(
    data: AdminCreate,
    admin: AdminUser = Depends(
        require_roles("Super Admin")
    ),
    db: Session = Depends(get_db),
):
    if data.role not in ["Super Admin", "Admin", "Editor", "Moderador"]:
        raise HTTPException(
            status_code=400,
            detail="Função inválida"
        )

    if len(data.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="A senha deve ter pelo menos 8 caracteres"
        )

    email = data.email.lower().strip()

    existing = db.query(AdminUser).filter(
        AdminUser.email == email
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Já existe um administrador com esse email"
        )

    now = datetime.now(timezone.utc).isoformat()

    new_admin = AdminUser(
        name=data.name.strip(),
        email=email,
        password_hash=hash_password(data.password),
        role=data.role,
        is_active=True,
        created_at=now,
        updated_at=now,
    )

    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    create_admin_log(db, admin.id, "CREATE_ADMIN", f"Administrador criado: {new_admin.email}", "admin", new_admin.id)

    return {
        "message": "Administrador criado com sucesso",
        "id": new_admin.id,
        "name": new_admin.name,
        "email": new_admin.email,
        "role": new_admin.role,
    }


@router.get("/logs")
def list_logs(
    admin: AdminUser = Depends(
        require_roles("Super Admin", "Admin")
    ),
    db: Session = Depends(get_db),
):
    from backend.admin_models import AdminLog

    logs = (
        db.query(AdminLog)
        .order_by(AdminLog.id.desc())
        .limit(200)
        .all()
    )

    return [
        {
            "id": log.id,
            "admin_id": log.admin_id,
            "action": log.action,
            "description": log.description,
            "resource": log.resource,
            "resource_id": log.resource_id,
            "created_at": log.created_at,
        }
        for log in logs
    ]


@router.put("/admins/{admin_id}")
def update_admin(
    admin_id: int,
    data: AdminUpdate,
    admin: AdminUser = Depends(require_roles("Super Admin")),
    db: Session = Depends(get_db),
):
    target = db.query(AdminUser).filter(AdminUser.id == admin_id).first()

    if not target:
        raise HTTPException(status_code=404, detail="Administrador não encontrado")

    updates = data.model_dump(exclude_unset=True)

    if "email" in updates:
        existing = (
            db.query(AdminUser)
            .filter(AdminUser.email == updates["email"], AdminUser.id != admin_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Email já está em uso")

    for field, value in updates.items():
        if field == "password":
            target.password_hash = get_password_hash(value)
        elif field != "password":
            setattr(target, field, value)

    target.updated_at = datetime.now(timezone.utc).isoformat()

    db.commit()
    db.refresh(target)

    create_admin_log(
        db,
        admin.id,
        "UPDATE_ADMIN",
        f"Administrador atualizado: {target.email}",
        "admin",
        target.id,
    )

    return {
        "id": target.id,
        "name": target.name,
        "email": target.email,
        "role": target.role,
        "is_active": target.is_active,
        "updated_at": target.updated_at,
    }


@router.post("/backup")
def create_backup(
    admin: AdminUser = Depends(require_roles("Super Admin", "Admin")),
    db: Session = Depends(get_db),
):
    import shutil
    from pathlib import Path
    from datetime import datetime, timezone

    source = Path("database/ff_sensitivity.db")
    backup_dir = Path("backups")
    backup_dir.mkdir(exist_ok=True)

    if not source.exists():
        raise HTTPException(status_code=404, detail="Banco de dados não encontrado")

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    destination = backup_dir / f"ff_sensitivity_{timestamp}.db"

    shutil.copy2(source, destination)

    create_admin_log(
        db=db,
        admin_id=admin.id,
        action="CREATE_BACKUP",
        description=f"Backup criado: {destination.name}",
        resource="database",
        resource_id=None,
    )

    return {
        "message": "Backup criado com sucesso",
        "filename": destination.name,
        "path": str(destination),
    }


@router.get("/backups")
def list_backups(
    admin: AdminUser = Depends(require_roles("Super Admin", "Admin")),
):
    from pathlib import Path

    backup_dir = Path("backups")
    backup_dir.mkdir(exist_ok=True)

    backups = []

    for file in sorted(
        backup_dir.glob("ff_sensitivity_*.db"),
        key=lambda x: x.stat().st_mtime,
        reverse=True,
    ):
        backups.append({
            "filename": file.name,
            "size": file.stat().st_size,
            "created_at": datetime.fromtimestamp(
                file.stat().st_mtime,
                timezone.utc
            ).isoformat(),
        })

    return {
        "total": len(backups),
        "backups": backups,
    }


@router.get("/backups/{filename}")
def download_backup(
    filename: str,
    admin: AdminUser = Depends(require_roles("Super Admin", "Admin")),
):
    from pathlib import Path
    from fastapi.responses import FileResponse

    backup_dir = Path("backups").resolve()
    file = (backup_dir / filename).resolve()

    if file.parent != backup_dir:
        raise HTTPException(status_code=400, detail="Nome de arquivo inválido")

    if not file.exists() or file.suffix != ".db":
        raise HTTPException(status_code=404, detail="Backup não encontrado")

    return FileResponse(
        path=str(file),
        filename=file.name,
        media_type="application/octet-stream",
    )


@router.delete("/backups/{filename}")
def delete_backup(
    filename: str,
    admin: AdminUser = Depends(require_roles("Super Admin")),
    db: Session = Depends(get_db),
):
    from pathlib import Path

    backup_dir = Path("backups").resolve()
    file = (backup_dir / filename).resolve()

    if file.parent != backup_dir:
        raise HTTPException(status_code=400, detail="Nome de arquivo inválido")

    if not file.exists() or file.suffix != ".db":
        raise HTTPException(status_code=404, detail="Backup não encontrado")

    file.unlink()

    create_admin_log(
        db=db,
        admin_id=admin.id,
        action="DELETE_BACKUP",
        description=f"Backup eliminado: {filename}",
        resource="database",
        resource_id=None,
    )

    return {
        "message": "Backup eliminado com sucesso",
        "filename": filename,
    }


@router.get("/generations")
def list_generations(
    admin: AdminUser = Depends(require_roles("Super Admin", "Admin")),
    db: Session = Depends(get_db),
):
    generations = (
        db.query(GenerationLog)
        .order_by(GenerationLog.id.desc())
        .limit(500)
        .all()
    )

    return [
        {
            "id": item.id,
            "device_id": item.device_id,
            "brand": item.brand,
            "model": item.model,
            "level": item.level,
            "style": item.style,
            "created_at": item.created_at,
        }
        for item in generations
    ]


@router.get("/generations/stats")
def generation_stats(
    admin: AdminUser = Depends(require_roles("Super Admin", "Admin")),
    db: Session = Depends(get_db),
):
    total = db.query(GenerationLog).count()

    devices = (
        db.query(GenerationLog.device_id)
        .distinct()
        .count()
    )

    levels = (
        db.query(GenerationLog.level)
        .distinct()
        .count()
    )

    styles = (
        db.query(GenerationLog.style)
        .distinct()
        .count()
    )

    return {
        "total": total,
        "devices": devices,
        "levels": levels,
        "styles": styles,
    }

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.sensitivity_models import Sensitivity
from backend.models import Device
from backend.recommendation import adjust_sensitivity
from backend.auth import require_roles
from backend.schemas import SensitivityUpdate
from backend.admin_logs import create_admin_log
from backend.generation_models import GenerationLog
from datetime import datetime, timezone

router = APIRouter(
    prefix="/api/sensitivities",
    tags=["Sensitivities"]
)

@router.get("/stats")
def sensitivity_stats(db: Session = Depends(get_db)):
    total = db.query(Sensitivity).count()
    devices = db.query(Sensitivity.device_id).distinct().count()
    levels = db.query(Sensitivity.level).distinct().count()
    styles = db.query(Sensitivity.style).distinct().count()

    return {
        "total": total,
        "devices": devices,
        "levels": levels,
        "styles": styles,
    }

@router.get("/{device_id}")
def list_sensitivities(device_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Sensitivity)
        .filter(Sensitivity.device_id == device_id)
        .all()
    )

@router.get("/{device_id}/recommend")
def recommend_sensitivity(
    device_id: int,
    level: str,
    style: str,
    db: Session = Depends(get_db)
):
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.status == True
    ).first()

    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo não encontrado")

    sensitivity = db.query(Sensitivity).filter(
        Sensitivity.device_id == device_id,
        Sensitivity.level == level,
        Sensitivity.style == style
    ).first()

    if not sensitivity:
        raise HTTPException(status_code=404, detail="Sensibilidade não encontrada")

    values = {
        "geral": sensitivity.geral,
        "red_dot": sensitivity.red_dot,
        "mira_2x": sensitivity.mira_2x,
        "mira_4x": sensitivity.mira_4x,
        "mira_awm": sensitivity.mira_awm,
        "olhadinha": sensitivity.olhadinha,
    }

    adjusted = adjust_sensitivity(
        values,
        device.ram,
        device.processor,
        device.fps,
        device.refresh_rate,
        device.recommended_dpi
    )

    generation_log = GenerationLog(
        device_id=device.id,
        brand=device.brand,
        model=device.model,
        level=level,
        style=style,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(generation_log)
    db.commit()

    return {
        "device_id": device.id,
        "brand": device.brand,
        "model": device.model,
        "level": level,
        "style": style,
        **adjusted
    }

@router.post("")
def create_sensitivity(
    device_id: int,
    level: str,
    style: str,
    geral: int,
    red_dot: int,
    mira_2x: int,
    mira_4x: int,
    mira_awm: int,
    olhadinha: int,
    admin=Depends(require_roles("Super Admin", "Admin", "Editor")), db: Session = Depends(get_db)
):
    sensitivity = Sensitivity(
        device_id=device_id,
        level=level,
        style=style,
        geral=geral,
        red_dot=red_dot,
        mira_2x=mira_2x,
        mira_4x=mira_4x,
        mira_awm=mira_awm,
        olhadinha=olhadinha,
    )

    db.add(sensitivity)
    db.commit()
    db.refresh(sensitivity)
    create_admin_log(db, admin.id, "CREATE_SENSITIVITY", f"Sensibilidade criada: {sensitivity.level} / {sensitivity.style}", "sensitivity", sensitivity.id)

    return sensitivity


@router.put("/{sensitivity_id}")
def update_sensitivity(
    sensitivity_id: int,
    data: SensitivityUpdate,
    admin=Depends(require_roles("Super Admin", "Admin", "Editor")),
    db: Session = Depends(get_db)
):
    sensitivity = db.query(Sensitivity).filter(
        Sensitivity.id == sensitivity_id
    ).first()

    if not sensitivity:
        raise HTTPException(
            status_code=404,
            detail="Sensibilidade não encontrada"
        )

    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(sensitivity, field, value)

    db.commit()
    db.refresh(sensitivity)
    create_admin_log(db, admin.id, "UPDATE_SENSITIVITY", f"Sensibilidade atualizada: {sensitivity.level} / {sensitivity.style}", "sensitivity", sensitivity.id)

    return sensitivity

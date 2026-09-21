from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Device
from backend.auth import require_roles
from backend.schemas import DeviceCreate, DeviceUpdate
from backend.admin_logs import create_admin_log

router = APIRouter(prefix="/api/devices", tags=["Devices"])


@router.get("")
def list_devices(db: Session = Depends(get_db)):
    return db.query(Device).filter(Device.status == True).order_by(Device.brand, Device.model).all()


@router.get("/all")
def list_all_devices(
    admin=Depends(require_roles("Super Admin", "Admin", "Editor")),
    db: Session = Depends(get_db)
):
    return (
        db.query(Device)
        .order_by(Device.brand, Device.model)
        .all()
    )


@router.post("")
def create_device(data: DeviceCreate, admin=Depends(require_roles("Super Admin", "Admin", "Editor")), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc).isoformat()

    device = Device(
        brand=data.brand,
        model=data.model,
        ram=data.ram,
        processor=data.processor,
        refresh_rate=data.refresh_rate,
        fps=data.fps,
        recommended_dpi=data.recommended_dpi,
        status=True,
        created_at=now,
        updated_at=now,
    )

    db.add(device)
    db.commit()
    db.refresh(device)
    create_admin_log(db, admin.id, "CREATE_DEVICE", f"Dispositivo criado: {device.brand} {device.model}", "device", device.id)

    return device


@router.put("/{device_id}")
def update_device(device_id: int, data: DeviceUpdate, admin=Depends(require_roles("Super Admin", "Admin", "Editor")), db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()

    if not device:
        return {"error": "Dispositivo não encontrado"}

    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(device, field, value)

    device.updated_at = datetime.now(timezone.utc).isoformat()

    db.commit()
    db.refresh(device)

    return device


@router.delete("/{device_id}")
def delete_device(
    device_id: int,
    admin=Depends(require_roles("Super Admin", "Admin")),
    db: Session = Depends(get_db)
):
    device = db.query(Device).filter(Device.id == device_id).first()

    if not device:
        return {"error": "Dispositivo não encontrado"}

    device.status = False
    device.updated_at = datetime.now(timezone.utc).isoformat()

    db.commit()
    create_admin_log(db, admin.id, "DELETE_DEVICE", f"Dispositivo desativado: {device.brand} {device.model}", "device", device.id)

    return {
        "message": "Dispositivo desativado com sucesso",
        "id": device.id,
        "brand": device.brand,
        "model": device.model,
        "status": device.status
    }

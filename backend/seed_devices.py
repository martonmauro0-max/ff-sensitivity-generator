import json
from datetime import datetime, timezone

from backend.database import SessionLocal
from backend.models import Device

db = SessionLocal()

with open("backend/devices_seed.json", "r", encoding="utf-8") as file:
    devices = json.load(file)

added = 0
skipped = 0

for data in devices:
    exists = db.query(Device).filter(
        Device.brand == data["brand"],
        Device.model == data["model"]
    ).first()

    if exists:
        skipped += 1
        continue

    now = datetime.now(timezone.utc).isoformat()

    device = Device(
        brand=data["brand"],
        model=data["model"],
        ram=data.get("ram"),
        processor=data.get("processor"),
        refresh_rate=data.get("refresh_rate"),
        fps=data.get("fps"),
        recommended_dpi=data.get("recommended_dpi"),
        status=True,
        created_at=now,
        updated_at=now,
    )

    db.add(device)
    added += 1

db.commit()
db.close()

print(f"ADICIONADOS: {added}")
print(f"JÁ EXISTIAM: {skipped}")
print("DEVICES SEED OK")

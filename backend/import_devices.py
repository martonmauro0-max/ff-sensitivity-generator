import json
import sys
from datetime import datetime, timezone

from backend.database import SessionLocal
from backend.models import Device

db = SessionLocal()

seed_file = sys.argv[1] if len(sys.argv) > 1 else "backend/devices_seed.json"

with open(seed_file, "r", encoding="utf-8") as file:
    devices = json.load(file)

added = 0
skipped = 0

for data in devices:
    brand = data["brand"].strip()
    model = data["model"].strip()

    exists = db.query(Device).filter(
        Device.brand == brand,
        Device.model == model
    ).first()

    if exists:
        skipped += 1
        continue

    now = datetime.now(timezone.utc).isoformat()

    db.add(Device(
        brand=brand,
        model=model,
        ram=data.get("ram"),
        processor=data.get("processor"),
        refresh_rate=data.get("refresh_rate"),
        fps=data.get("fps"),
        recommended_dpi=data.get("recommended_dpi"),
        status=True,
        created_at=now,
        updated_at=now,
    ))

    added += 1

db.commit()
db.close()

print(f"ADICIONADOS: {added}")
print(f"IGNORADOS/DUPLICADOS: {skipped}")
print("IMPORTAÇÃO OK")

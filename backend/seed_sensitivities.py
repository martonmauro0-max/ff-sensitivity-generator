from backend.database import SessionLocal
from backend.models import Device
from backend.sensitivity_models import Sensitivity

db = SessionLocal()

device = db.query(Device).filter(
    Device.brand == "Samsung",
    Device.model == "Galaxy A55 5G"
).first()

if not device:
    print("ERRO: Galaxy A55 5G não encontrado.")
    db.close()
    raise SystemExit(1)

data = {
    "Headshot": {
        "Baixa": [155,150,140,125,90,155],
        "Média": [175,170,160,145,100,175],
        "Alta": [185,180,170,155,105,185],
        "Muito Alta": [195,190,180,165,110,195],
    },
    "Precisão": {
        "Baixa": [145,140,130,115,85,145],
        "Média": [160,155,145,130,95,160],
        "Alta": [175,170,160,145,100,175],
        "Muito Alta": [190,185,175,160,108,190],
    },
    "Drag Shot": {
        "Baixa": [165,160,150,135,90,165],
        "Média": [180,175,165,150,100,180],
        "Alta": [190,185,175,160,108,190],
        "Muito Alta": [200,195,185,170,115,200],
    },
    "Equilibrado": {
        "Baixa": [150,145,135,120,85,150],
        "Média": [165,160,150,135,95,165],
        "Alta": [180,175,165,150,100,180],
        "Muito Alta": [190,185,175,160,108,190],
    },
    "Movimento rápido": {
        "Baixa": [170,165,155,140,90,170],
        "Média": [185,180,170,155,100,185],
        "Alta": [195,190,180,165,110,195],
        "Muito Alta": [200,195,185,175,115,200],
    },
}

added = 0
skipped = 0

for style, levels in data.items():
    for level, values in levels.items():
        exists = db.query(Sensitivity).filter(
            Sensitivity.device_id == device.id,
            Sensitivity.style == style,
            Sensitivity.level == level
        ).first()

        if exists:
            skipped += 1
            continue

        sensitivity = Sensitivity(
            device_id=device.id,
            level=level,
            style=style,
            geral=values[0],
            red_dot=values[1],
            mira_2x=values[2],
            mira_4x=values[3],
            mira_awm=values[4],
            olhadinha=values[5],
        )

        db.add(sensitivity)
        added += 1

db.commit()
db.close()

print(f"ADICIONADAS: {added}")
print(f"JÁ EXISTIAM: {skipped}")
print("SEED OK")

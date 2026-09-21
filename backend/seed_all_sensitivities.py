from backend.database import SessionLocal
from backend.models import Device
from backend.sensitivity_models import Sensitivity

levels = ["Baixa", "Média", "Alta", "Muito Alta"]
styles = ["Headshot", "Precisão", "Drag Shot", "Equilibrado", "Movimento rápido"]

base = {
"Headshot":[185,180,170,155,105,185],
"Precisão":[175,170,160,145,100,175],
"Drag Shot":[190,185,175,160,108,190],
"Equilibrado":[180,175,165,150,100,180],
"Movimento rápido":[195,190,180,165,110,195]
}

adjust={"Baixa":-30,"Média":-15,"Alta":0,"Muito Alta":10}

db=SessionLocal()
devices=db.query(Device).filter(Device.status==True).all()
added=0
existing=0

for device in devices:
    for style in styles:
        for level in levels:
            exists=db.query(Sensitivity).filter(
                Sensitivity.device_id==device.id,
                Sensitivity.style==style,
                Sensitivity.level==level
            ).first()

            if exists:
                existing+=1
                continue

            v=[max(1,min(200,x+adjust[level])) for x in base[style]]

            db.add(Sensitivity(
                device_id=device.id,
                level=level,
                style=style,
                geral=v[0],
                red_dot=v[1],
                mira_2x=v[2],
                mira_4x=v[3],
                mira_awm=v[4],
                olhadinha=v[5]
            ))
            added+=1

db.commit()
db.close()

print("DISPOSITIVOS PROCESSADOS:",len(devices))
print("SENSIBILIDADES ADICIONADAS:",added)
print("JÁ EXISTIAM:",existing)
print("SEED GERAL OK")

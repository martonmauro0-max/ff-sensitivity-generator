from backend.database import Base, engine
from backend import models, sensitivity_models, admin_models, generation_models

Base.metadata.create_all(bind=engine)

print("DATABASE OK")
print("Tabelas criadas com sucesso.")

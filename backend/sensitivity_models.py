from sqlalchemy import Column, ForeignKey, Integer, String
from backend.database import Base

class Sensitivity(Base):
    __tablename__ = "sensitivities"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False, index=True)

    level = Column(String(30), nullable=False)
    style = Column(String(30), nullable=False)

    geral = Column(Integer, nullable=False)
    red_dot = Column(Integer, nullable=False)
    mira_2x = Column(Integer, nullable=False)
    mira_4x = Column(Integer, nullable=False)
    mira_awm = Column(Integer, nullable=False)
    olhadinha = Column(Integer, nullable=False)

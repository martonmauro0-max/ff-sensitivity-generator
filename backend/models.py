from sqlalchemy import Boolean, Column, Float, Integer, String
from backend.database import Base

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String(100), nullable=False, index=True)
    model = Column(String(150), nullable=False, index=True)
    ram = Column(String(50))
    processor = Column(String(150))
    refresh_rate = Column(Integer)
    fps = Column(Integer)
    recommended_dpi = Column(Integer)

    status = Column(Boolean, default=True)

    created_at = Column(String(30))
    updated_at = Column(String(30))

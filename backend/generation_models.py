from sqlalchemy import Column, Integer, String
from backend.database import Base


class GenerationLog(Base):
    __tablename__ = "generation_logs"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, nullable=False, index=True)
    brand = Column(String(100), nullable=False)
    model = Column(String(150), nullable=False)
    level = Column(String(50), nullable=False)
    style = Column(String(50), nullable=False)
    created_at = Column(String(30), nullable=False, index=True)

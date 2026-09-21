from pydantic import BaseModel

class DeviceCreate(BaseModel):
    brand: str
    model: str
    ram: str | None = None
    processor: str | None = None
    refresh_rate: int | None = None
    fps: int | None = None
    recommended_dpi: int | None = None

class DeviceUpdate(BaseModel):
    brand: str | None = None
    model: str | None = None
    ram: str | None = None
    processor: str | None = None
    refresh_rate: int | None = None
    fps: int | None = None
    recommended_dpi: int | None = None
    status: bool | None = None

class SensitivityUpdate(BaseModel):
    device_id: int | None = None
    level: str | None = None
    style: str | None = None
    geral: int | None = None
    red_dot: int | None = None
    mira_2x: int | None = None
    mira_4x: int | None = None
    mira_awm: int | None = None
    olhadinha: int | None = None

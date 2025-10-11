from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class FieldCreate(BaseModel):
    name: str
    boundary_wkt: str  # Polygon in WKT format (e.g., 'POLYGON((...))')
    owner_id: UUID

class FieldOut(BaseModel):
    id: UUID
    name: str
    boundary_wkt: str
    owner_id: UUID

    class Config:
        orm_mode = True

from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry
import uuid
from .db import Base

class Field(Base):
    __tablename__ = "fields"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    boundary = Column(Geometry("POLYGON"), nullable=False)
    owner_id = Column(UUID(as_uuid=True), nullable=False)

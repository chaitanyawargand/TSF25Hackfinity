from sqlalchemy.orm import Session
from app import models
from app.schemas import FieldCreate
from geoalchemy2.shape import from_shape, to_shape
from shapely import wkt

def create_field(db: Session, field_data: FieldCreate):
    geom = from_shape(wkt.loads(field_data.boundary_wkt), srid=4326)
    field = models.Field(
        name=field_data.name,
        boundary=geom,
        owner_id=field_data.owner_id
    )
    db.add(field)
    db.commit()
    db.refresh(field)
    return field

def get_fields(db: Session, owner_id):
    return db.query(models.Field).filter(models.Field.owner_id == owner_id).all()

def get_field_by_id(db: Session, field_id):
    return db.query(models.Field).filter(models.Field.id == field_id).first()

def update_field(db: Session, field_id, new_name: str):
    field = get_field_by_id(db, field_id)
    if not field:
        return None
    field.name = new_name
    db.commit()
    db.refresh(field)
    return field

def delete_field(db: Session, field_id):
    field = get_field_by_id(db, field_id)
    if not field:
        return False
    db.delete(field)
    db.commit()
    return True

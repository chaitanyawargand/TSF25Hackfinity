from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.schemas import FieldCreate, FieldOut
from app.crud import field_crud

router = APIRouter(prefix="/fields", tags=["Fields"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=FieldOut)
def create_field(field: FieldCreate, db: Session = Depends(get_db)):
    return field_crud.create_field(db, field)

@router.get("/", response_model=list[FieldOut])
def list_fields(owner_id: str, db: Session = Depends(get_db)):
    fields = field_crud.get_fields(db, owner_id)
    return [
        FieldOut(
            id=f.id,
            name=f.name,
            owner_id=f.owner_id,
            boundary_wkt=f.boundary.desc  # Convert geometry to WKT string
        )
        for f in fields
    ]

@router.patch("/{field_id}", response_model=FieldOut)
def update_field(field_id: str, new_name: str, db: Session = Depends(get_db)):
    updated = field_crud.update_field(db, field_id, new_name)
    if not updated:
        raise HTTPException(status_code=404, detail="Field not found")
    return updated

@router.delete("/{field_id}")
def delete_field(field_id: str, db: Session = Depends(get_db)):
    ok = field_crud.delete_field(db, field_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Field not found")
    return {"message": "Field deleted successfully"}

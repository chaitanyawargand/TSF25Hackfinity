# main.py
from fastapi import FastAPI
from app.routes.fields import router as field_router
from app.database import Base, engine

# Create all database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Field Management Service",
    description="Manages agricultural fields using PostGIS geometry for drone missions.",
    version="1.0.0",
)

# Include the Field routes
app.include_router(field_router, prefix="/fields", tags=["Fields"])

# Health check endpoint
@app.get("/")
def root():
    return {"message": "Field Management Service is running."}

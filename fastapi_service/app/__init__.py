# app/__init__.py
from fastapi import FastAPI
from .routes.fields import router as field_router

def create_app():
    app = FastAPI(title="Drone Field Management API")
    app.include_router(field_router)
    return app

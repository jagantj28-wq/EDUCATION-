import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.database.session import engine, Base
import app.models  # Registers all models with Base.metadata
from app.routes import (
    auth,
    dashboard,
    subjects,
    assignments,
    exams,
    attendance,
    study_plan,
    notes,
    ai,
    analytics,
    notifications,
    settings as app_settings
)
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("lifedesk")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing LifeDesk Database models...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully.")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="LifeDesk — AI-Powered Student Assistant REST API",
    version="1.0.0",
    debug=settings.DEBUG,
    lifespan=lifespan
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All Routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(subjects.router)
app.include_router(assignments.router)
app.include_router(exams.router)
app.include_router(attendance.router)
app.include_router(study_plan.router)
app.include_router(notes.router)
app.include_router(ai.router)
app.include_router(analytics.router)
app.include_router(notifications.router)
app.include_router(app_settings.router)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "env": settings.APP_ENV,
        "version": "1.0.0"
    }


# Serve React Frontend Static Files (if available)
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    async def serve_root():
        index_file = os.path.join(static_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {
            "status": "healthy",
            "message": "LifeDesk API is running. Explore the interactive documentation at /docs",
            "docs_url": "/docs"
        }

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow API routes, docs, and openapi schema to bypass SPA handler
        if full_path.startswith("api/") or full_path in ("docs", "openapi.json", "redoc"):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = os.path.join(static_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(static_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Page not found")
else:
    @app.get("/")
    async def serve_fallback_root():
        return {
            "status": "healthy",
            "message": "LifeDesk API is running. Explore the interactive documentation at /docs",
            "docs_url": "/docs"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)

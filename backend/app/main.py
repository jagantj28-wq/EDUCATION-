from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)

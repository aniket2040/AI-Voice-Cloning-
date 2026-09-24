import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import settings
from app.core.logging import setup_logging
from app.api.routes.voices import router as voices_router
from app.services.neutts_service import NeuTTSService
from app.api.routes.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware

setup_logging()

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "Starting %s v%s",
        settings.app_name,
        settings.app_version,
    )

    # Allow tests to provide a mocked NeuTTS service.
    neutts_service_factory = getattr(
        app.state,
        "neutts_service_factory",
        NeuTTSService,
    )

    logger.info("Loading NeuTTS service...")

    app.state.neutts_service = (
        neutts_service_factory()
    )

    logger.info(
        "NeuTTS service loaded successfully"
    )

    yield

    logger.info("Shutting down application")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(voices_router)
app.include_router(auth_router)


@app.get("/health")
async def health_check() -> dict:
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
    }
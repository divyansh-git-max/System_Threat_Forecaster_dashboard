"""FastAPI application entry point."""
from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ml.pipeline import get_models
from routers.predict import router as predict_router
from routers.metrics import router as metrics_router


def _cors_origins() -> list[str]:
    local_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    configured = [
        origin.strip()
        for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
        if origin.strip()
    ]
    return local_origins + configured


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Optionally pre-load models; default to lazy loading for fast startup."""
    if os.getenv("PRELOAD_MODELS") == "1":
        print("Loading / training models...")
        get_models()
        print("Models ready.")
    yield


app = FastAPI(
    title="System Threat Forecaster API",
    description="ML-powered malware detection REST API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router)
app.include_router(metrics_router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "System Threat Forecaster"}

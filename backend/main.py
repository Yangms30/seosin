from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from database import Base, engine
import models  # noqa: F401  ensure models are registered with Base
from routers import briefings, send, settings as settings_router, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="BriefBot API", version="0.1.0", lifespan=lifespan)

cfg = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cfg.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["settings"])
app.include_router(briefings.router, prefix="/api/briefings", tags=["briefings"])
app.include_router(send.router, prefix="/api/send", tags=["send"])


@app.get("/api/health")
def health():
    return {"status": "ok"}

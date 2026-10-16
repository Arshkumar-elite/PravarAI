import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import create_tables
from app.routes import router

logger = logging.getLogger("leadflow")


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield


app = FastAPI(title="LeadFlow API", version="1.0.0", lifespan=lifespan)


@app.exception_handler(Exception)
async def unexpected_error(request: Request, exc: Exception):
    logger.exception("Unhandled API error on %s", request.url.path, exc_info=exc)
    return JSONResponse(
        status_code=500, content={"detail": "Something went wrong. Please try again."}
    )


app.include_router(router)
# Wrap the entire application so even unexpected-error responses receive CORS headers.
app = CORSMiddleware(
    app,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type"],
)

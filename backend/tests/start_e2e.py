"""Start an isolated seeded API for browser tests; never reuse the developer database."""

import os
import subprocess
import sys
import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory(prefix="leadflow-e2e-") as folder:
    env = {
        **os.environ,
        "DATABASE_URL": f"sqlite:///{Path(folder) / 'e2e.db'}",
        "CORS_ORIGINS": "http://127.0.0.1:3001",
        "SEED_TIMEZONE": "Asia/Kolkata",
    }
    subprocess.run(
        [
            sys.executable,
            "-c",
            (
                "from datetime import UTC, datetime; from sqlmodel import Session; "
                "from app.database import engine, create_tables; from app.seed import seed; "
                "create_tables(); s=Session(engine); "
                + (
                    "seed(s); s.close()"
                    if os.environ.get("LEADFLOW_DEMO_REAL_TIME") == "1"
                    else "seed(s, datetime(2026,10,16,6,30,tzinfo=UTC)); s.close()"
                )
            ),
        ],
        env=env,
        check=True,
    )
    try:
        subprocess.run(
            [
                sys.executable,
                "-m",
                "uvicorn",
                "app.main:app",
                "--host",
                "127.0.0.1",
                "--port",
                "8001",
            ],
            env=env,
            check=True,
        )
    except KeyboardInterrupt:
        pass

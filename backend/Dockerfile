FROM ghcr.io/astral-sh/uv:0.11.28 AS uv
FROM python:3.13-slim
COPY --from=uv /uv /usr/local/bin/uv
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_LINK_MODE=copy UV_CACHE_DIR=/tmp/uv-cache
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
RUN useradd --uid 10001 --create-home leadflow && mkdir -p /app/data && chown leadflow:leadflow /app/data
COPY --chown=leadflow:leadflow app ./app
USER leadflow
EXPOSE 8000
CMD ["/app/.venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

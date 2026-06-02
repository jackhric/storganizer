# syntax=docker/dockerfile:1.7

# ---------- Stage 1: build the static Next.js bundle ----------
FROM node:22-bookworm-slim AS web-builder
WORKDIR /web

RUN npm install -g npm@11

COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY apps/web/ ./
# Same-origin in production: FastAPI serves this bundle at "/" alongside /api,
# so the browser talks to a single host. Overrides any .env defaults because
# process.env takes precedence in Next.js's env loader.
ENV NEXT_PUBLIC_BACKEND_URL=""
RUN npm run build
# next.config.ts has output: "export" -> static files land in ./out


# ---------- Stage 2: runtime ----------
FROM python:3.13-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install Python deps. Source must be present at install time because
# pyproject.toml + src layout means the package is built from ./src.
COPY apps/server/pyproject.toml apps/server/README.md ./
COPY apps/server/src ./src
RUN pip install .

# Migrations live alongside the app and can be invoked via `alembic upgrade head`.
COPY apps/server/alembic.ini ./alembic.ini
COPY apps/server/alembic ./alembic

# Pre-built web bundle from stage 1.
COPY --from=web-builder /web/out ./web

# Mountable volumes for SQLite db + uploaded images.
RUN mkdir -p /app/data /app/storage

ENV WEB_DIR=/app/web \
    STORAGE_DIR=/app/storage \
    DATABASE_URL="sqlite+aiosqlite:////app/data/storganizer.db" \
    AUTO_CREATE_DB=true

EXPOSE 8090

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8090"]

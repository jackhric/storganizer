"""Application settings.

Per the FastAPI best-practices convention, configuration is centralised here
and read from the environment (optionally an .env file). Keep this small and
purposeful — module-specific knobs belong with their module.
"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="", extra="ignore")

    # Async SQLAlchemy URL. SQLite by default — single-file, zero-config,
    # the same storage engine PocketBase embedded.
    database_url: str = "sqlite+aiosqlite:///./storganizer.db"

    # Where uploaded item images (and generated thumbnails) live on disk.
    storage_dir: Path = Path("./storage")

    # Pre-built static web bundle (Next.js export). When set and present,
    # the app serves it at "/" alongside the API at "/api" so a single
    # container can host both. Leave unset in dev — the Next dev server
    # runs separately on port 3000.
    web_dir: Path | None = None

    # Browser origins allowed to call the API (the Next.js dev server).
    cors_origins: list[str] = ["http://localhost:3000"]

    # Background heartbeat cadence — pings every device to update online state.
    heartbeat_interval_seconds: int = 60

    # Per-request timeout when talking to a WLED device's HTTP JSON API.
    wled_timeout_seconds: float = 3.0

    # Create tables on startup if they don't exist. Mirrors PocketBase's
    # automigrate-on-`go run` dev behaviour. Use Alembic for real deployments.
    auto_create_db: bool = True


settings = Settings()

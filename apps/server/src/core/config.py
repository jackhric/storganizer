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

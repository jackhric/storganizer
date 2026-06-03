# Storganizer Server

FastAPI backend for Storganizer. Replaces the previous Go/PocketBase service
with an explicit, typed REST API over SQLAlchemy + SQLite, plus a WebSocket for
realtime WARLS LED streaming.

## Stack

| Concern        | Choice                                   |
| -------------- | ---------------------------------------- |
| Web framework  | FastAPI (async)                          |
| Auto-CRUD      | FastCRUD (used for the `tags` resource)  |
| ORM            | SQLAlchemy 2.0 (async) + aiosqlite       |
| Migrations     | Alembic                                  |
| Validation     | Pydantic v2                              |
| Images         | Pillow (on-demand thumbnails)            |
| Tests          | pytest + pytest-asyncio + httpx          |
| Lint/format    | ruff                                     |

## Layout

Organised by domain (not by file type), mirroring the previous module layout:

```
src/
├── main.py            # app factory, lifespan, router wiring
├── core/              # config, db engine/session, id + timestamp mixins
├── wled/              # WLED JSON client + WARLS UDP (no DB deps)
├── warls/             # WARLS WebSocket session + keepalive registry
├── devices/           # router · service · models · schemas · exceptions
├── cells/
├── items/             # + storage.py (image upload / thumbnails)
├── assignments/
└── tags/              # router uses FastCRUD's generated CRUD
```

Each domain keeps routers thin, business logic in `service.py`, and
request/response schemas (`schemas.py`) decoupled from ORM models
(`models.py`). The two former PocketBase record hooks — populate-from-WLED and
derive-cells — now run as explicit steps in `devices.service.create`.

## Running

```bash
cd apps/server
python -m venv .venv && source .venv/bin/activate
pip install -e '.[dev]'

uvicorn src.main:app --reload --port 8090
```

- API: http://localhost:8090/api
- Interactive docs (OpenAPI): http://localhost:8090/docs

In development the app creates tables on startup (`AUTO_CREATE_DB=true`). For
production, disable that and use Alembic:

```bash
alembic upgrade head
```

## Tests & lint

```bash
pytest          # in-memory SQLite, fake WLED — no hardware needed
ruff check src tests
```

## Generating frontend types

The whole point of the API contract is end-to-end types. From the running
server, the frontend can generate a typed client from the OpenAPI schema:

```bash
# in apps/web
npx openapi-typescript http://localhost:8090/openapi.json -o src/lib/api/schema.ts
```

> Note: the frontend still targets the old PocketBase SDK and must be migrated
> to this REST contract separately — this change rewrites the backend only.
```

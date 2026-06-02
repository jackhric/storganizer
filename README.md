<div align="center">
  <img src="apps/web/public/storganizer.svg" alt="Storganizer" width="320" />
  <p>Make finding your Arduino components a breeze. Easy-to-use inventory management system powered by WLED addressable LEDs</p>

[![License](https://img.shields.io/badge/license-AGPL%203.0-green)](LICENSE)
![Version](https://img.shields.io/github/v/release/jackhric/storganizer?sort=semver)

</div>

---

Storganizer lets you map physical storage locations (bins, drawers, shelves) to LEDs on a [WLED](https://kno.wled.ge/) device. Find any component instantly. Look up the part and the correct LED lights up in a jiffy!

## Features

- Manage an inventory of components with descriptions, quantities, categories, and datasheets
- Register WLED devices and sync their LED count and grid dimensions from the hardware
- Assign cells (individual LEDs) to items
- Highlight item locations by triggering the corresponding LEDs on the physical device

## Getting Started

**With Docker:**

```bash
docker run -d --name storganizer -p 8090:8090 \
  -v storganizer-data:/app/data \
  -v storganizer-storage:/app/storage \
  ghcr.io/jackhric/storganizer:latest
```

**With Docker Compose:**

A [`docker-compose.yml`](docker-compose.yml) is included at the repo root:

```bash
docker compose up -d
```

Then open up your browser and point it to port 8090 to see the web UI. The database and uploaded images live in two separate volumes, so they survive restarts and upgrades.

## Development

**Prerequisites:** Node.js 20+, Python 3.11+ ([uv](https://docs.astral.sh/uv/) recommended)

Run the backend and frontend in separate terminals:

```bash
# Backend
cd apps/server && uv venv .venv && source .venv/bin/activate \
  && uv pip install -e '.[dev]' && uvicorn src.main:app --reload --port 8090

# Frontend
cd apps/web && npm install && npm run dev
```

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8090/api>
- API docs (OpenAPI): <http://localhost:8090/docs>

The frontend needs `NEXT_PUBLIC_BACKEND_URL=http://localhost:8090` in `apps/web/.env.local` (or `.env.development`) so calls from `next dev` find the backend on a different port. In the production container, both live behind the same origin so this is unset.

See [`apps/server/README.md`](apps/server/README.md) for backend details.

## Tech Stack

| Layer         | Technology                                                  |
| ------------- | ----------------------------------------------------------- |
| Frontend      | Next.js 16, React 19, TypeScript, TailwindCSS v4, shadcn/ui |
| Data fetching | TanStack Query v5                                           |
| Backend       | FastAPI, SQLAlchemy 2.0 (async) + SQLite, Pydantic v2       |
| Migrations    | Alembic                                                     |

## License

[GNU Affero General Public License v3.0](LICENSE)

## AI Disclosure

Code in this repository is written with AI assistance (primarily Claude Code). All planning, architectural decisions, feature design, and product direction are mine. All changes are reviewed for code quality and robustness.

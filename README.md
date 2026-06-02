<div align="center">
  <img src="apps/web/public/storganizer.svg" alt="Storganizer" width="320" />
  <p>Make finding your Arduino components a breeze. Easy-to-use inventory management system powered by WLED addressable LEDs</p>

![License](https://img.shields.io/github/license/jackhric/storganizer)
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

**Prerequisites:** Node.js 20+, Python 3.11+ ([uv](https://docs.astral.sh/uv/) recommended)

Run the backend and frontend in separate terminals:

```bash
# Backend
cd apps/server && uv venv .venv && source .venv/bin/activate \
  && uv pip install -e '.[dev]' && uvicorn src.main:app --reload --port 8090

# Frontend
cd apps/web && npm install && npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8090/api
- API docs (OpenAPI): http://localhost:8090/docs

See [`apps/server/README.md`](apps/server/README.md) for backend details.

> **Note:** the backend has been migrated from Go/PocketBase to FastAPI. The
> frontend still uses the PocketBase JS SDK and is pending migration to the new
> REST contract — generate a typed client with `openapi-typescript` against
> `/openapi.json`.

**Environment variables**

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8090
```

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

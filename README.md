<div align="center">
  <img src="apps/web/public/storganizer.svg" alt="Storganizer" width="320" />
  <p>Make finding your Arduino components a breeze. Easy-to-use inventory management system powered by WLED addressable LEDs</p>

  ![License](https://img.shields.io/github/license/jackhric/storganizer)
  ![Version](https://img.shields.io/github/package-json/v/jackhric/storganizer)
</div>

---

Storganizer lets you map physical storage locations (bins, drawers, shelves) to LEDs on a [WLED](https://kno.wled.ge/) device. Find any component instantly. Look up the part and the correct LED lights up.

## Features

- Manage an inventory of components with descriptions, quantities, categories, and datasheets
- Register WLED devices and sync their LED count and grid dimensions from the hardware
- Assign cells (individual LEDs) to items
- Highlight item locations by triggering the corresponding LEDs on the physical device

## Getting Started

**Prerequisites:** Node.js 20+, Go 1.25+

```bash
# Install dependencies
npm install

# Run both frontend and backend
npm run dev
```

- Frontend: http://localhost:3000
- Backend API + Admin UI: http://localhost:8090/\_/

To run them individually:

```bash
# Backend only
cd apps/server && go run main.go serve

# Frontend only
cd apps/web && npm run dev
```

**Environment variables**

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8090
```

## Tech Stack

| Layer         | Technology                                                  |
| ------------- | ----------------------------------------------------------- |
| Frontend      | Next.js 16, React 19, TypeScript, TailwindCSS v4, shadcn/ui |
| Data fetching | TanStack Query v5, PocketBase JS SDK                        |
| Backend       | Go, PocketBase (embedded SQLite + REST API)                 |
| Monorepo      | Turborepo, npm workspaces                                   |

## License

[GNU Affero General Public License v3.0](LICENSE)

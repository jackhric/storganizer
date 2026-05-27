<div align="center">
  <img src="apps/web/public/storganizer.svg" alt="Storganizer" width="320" />
  <p>Make finding your Arduino components a breeze. Easy-to-use inventory management system powered by WLED addressable LEDs</p>

![License](https://img.shields.io/github/license/jackhric/storganizer)
![Version](https://img.shields.io/github/package-json/v/jackhric/storganizer?filename=apps%2Fweb%2Fpackage.json)

</div>

---

Storganizer lets you map physical storage locations (bins, drawers, shelves) to LEDs on a [WLED](https://kno.wled.ge/) device. Find any component instantly. Look up the part and the correct LED lights up in a jiffy!

## Features

- Manage an inventory of components with descriptions, quantities, categories, and datasheets
- Register WLED devices and sync their LED count and grid dimensions from the hardware
- Assign cells (individual LEDs) to items
- Highlight item locations by triggering the corresponding LEDs on the physical device

## Getting Started

**Prerequisites:** Node.js 20+, Go 1.25+

Run the backend and frontend in separate terminals:

```bash
# Backend
cd apps/server && go run main.go serve

# Frontend
cd apps/web && npm install && npm run dev
```

- Frontend: http://localhost:3000
- Backend API + Admin UI: http://localhost:8090/\_/

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

## License

[GNU Affero General Public License v3.0](LICENSE)

## AI Disclosure

Code in this repository is written with AI assistance (primarily Claude Code). All planning, architectural decisions, feature design, and product direction are mine. All changes are reviewed for code quality and robustness.

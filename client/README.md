# Category Admin — Frontend

React + TypeScript + Vite + Ant Design UI for the Category Management API.

## Setup

```bash
npm install
npm run dev        # Dev server at http://localhost:5173
npm run build      # Production build → dist/
```

## Tabs

| Tab | Description |
|-----|-------------|
| **Category Tree** | Hierarchical tree view. Click a name to rename. Paste a category ID and click "Load Subtree" to filter. |
| **Flat List** | Paginated table with search. Shows ancestor path as tags. Edit, delete, toggle active/inactive per row. |
| **Create Category** | Create a new category with optional parent ID. |
| **Bulk Create** | Paste a nested JSON object/array to create multiple categories at once. |
| **Health** | Shows MongoDB and Redis connection status. |

## Structure

```
src/
├── api/            # API client (categoryApi.ts)
├── components/     # One component per tab
├── types/          # TypeScript interfaces
├── App.tsx         # Layout + tab routing
└── main.tsx        # Entry point
```

## API Proxy

In dev mode, Vite proxies `/api` and `/health` to `http://localhost:3000` (the Express server). See `vite.config.ts`.

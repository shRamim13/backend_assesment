# Category Management System

Hierarchical category manager with unlimited nesting, Redis caching, live-search tree navigation, and cascade operations.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Ant Design 5 |
| Backend | Node.js, Express 4, TypeScript |
| Database | MongoDB 6 + Mongoose |
| Cache | Redis 7 |
| Infrastructure | Docker Compose |

---

## Quick Start

### Prerequisites

- Docker & Docker Compose (for backend + databases)
- Node.js 18+

---

### Backend

```bash
cd server
cp .env.example .env
docker compose up -d          # starts MongoDB, Redis, API on port 3000
```

Or run locally with Docker databases:

```bash
cd server
npm install
npm run docker:dev             # starts MongoDB + Redis
npm run dev                    # API with hot reload on port 3000
```

### Frontend

```bash
cd client
npm install
npm run dev                    # Vite dev server on port 5173
```

Vite proxies `/api/*` and `/health` to `http://localhost:3000`.

### Access

| Service | URL |
|---------|-----|
| Frontend App | http://localhost:5173 |
| API Base | http://localhost:3000/api/categories |
| Health Check | http://localhost:3000/health |

---

## Architecture

```
client/                        server/
  src/                           src/
  ├── api/                        ├── app.ts
  │   └── categoryApi.ts          ├── config/
  ├── components/                  │   ├── env.config.ts
  │   ├── CategoryTree.tsx          │   ├── db.config.ts
  │   ├── CategoryList.tsx          │   └── redis.config.ts
  │   ├── CreateCategory.tsx       ├── models/
  │   ├── BulkCreate.tsx            │   └── category.model.ts
  │   └── HealthCheck.tsx          ├── repositories/
  ├── types/                        │   └── category.repository.ts
  │   └── index.ts                ├── services/
  ├── App.tsx                       │   ├── category.service.ts
  └── main.tsx                      │   └── cache.service.ts
                                  ├── controllers/
                                  │   └── category.controller.ts
                                  ├── routes/
                                  │   └── category.routes.ts
                                  ├── middleware/
                                  │   ├── validate.middleware.ts
                                  │   ├── cache.middleware.ts
                                  │   ├── error.middleware.ts
                                  │   └── logger.middleware.ts
                                  ├── utils/
                                  │   ├── dfs.util.ts
                                  │   ├── helpers.ts
                                  │   └── response.util.ts
                                  └── constants/
                                      └── messages.ts
```

### Request Flow

```
HTTP Request
    ↓
Route → Middleware (validate → cache) → Controller → Service → Repository → MongoDB
                                                                   ↓
                                                              Redis (cache)
    ↑
Response ← Controller ← Service ← Repository
```

---

## API Reference

All responses follow this format:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "...",
  "data": { ... },
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

Paginated responses include:

```json
{
  "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
}
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/categories` | Flat paginated list with optional `?name=` search |
| `GET` | `/api/categories/tree` | Full tree or subtree by `?id=` |
| `GET` | `/api/categories/:id` | Single category with ancestor chain |
| `POST` | `/api/categories` | Create single category |
| `POST` | `/api/categories/bulk` | Create nested tree in one shot |
| `PUT` | `/api/categories/:id` | Update category name |
| `DELETE` | `/api/categories/:id` | Delete category + all descendants |
| `PATCH` | `/api/categories/:id/deactivate` | Deactivate category + all descendants (cascade) |
| `PATCH` | `/api/categories/:id/activate` | Activate single category (parent must be active) |
| `GET` | `/health` | MongoDB + Redis connection status |

### Examples

**Flat list with pagination and search**

```
GET /api/categories?page=1&limit=10&name=watch
```

**Tree view**

```
GET /api/categories/tree
GET /api/categories/tree?id=<category_id>
```

**Create root category**

```json
POST /api/categories
{ "name": "Electronics" }
```

**Create child category**

```json
POST /api/categories
{ "name": "Accessories", "parentId": "<parent_id>" }
```

**Bulk create nested tree**

```json
POST /api/categories/bulk
{
  "name": "Clothes",
  "children": [
    {
      "name": "Men",
      "children": [
        { "name": "Western", "children": [
          { "name": "Shirt" },
          { "name": "Pant" }
        ]},
        { "name": "Local" }
      ]
    },
    {
      "name": "Women",
      "children": [
        { "name": "Western" },
        { "name": "Local" }
      ]
    }
  ]
}
```

Accepts either a single object or an array of root objects.

**Update name**

```json
PUT /api/categories/:id
{ "name": "Updated Name" }
```

**Deactivate (cascade)**

```
PATCH /api/categories/:id/deactivate
```

Sets `isActive: false` on the category and all descendants.

**Activate (single, parent guard)**

```
PATCH /api/categories/:id/activate
```

Sets `isActive: true` only on the specified category. Returns error if parent is inactive.

**Health check**

```
GET /health
```

```json
{
  "status": "ok",
  "environment": "development",
  "uptime": "120s",
  "services": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

---

## Frontend Features

The React UI has 5 tabs:

### Category Tree
- Hierarchical tree view with expand/collapse
- Click a node name to view details (ID, name, status, parent, ancestor chain, timestamps)
- Edit name inline (click the edit icon)
- Delete with confirmation popover
- Active/inactive status shown as colored tags on each node
- Searchable dropdown to load a specific subtree by name (shows full path in options)

### Flat List
- Paginated table with every category as a flat row
- Auto-search (debounced 400ms) — type and results update instantly
- Ancestor chain column with tag-style path separated by `>` arrows
- Edit name inline per row
- Active/inactive toggle switch per row
- Delete per row with confirmation
- View button opens detail modal

### Create Category
- Name input and optional parent selector (searchable dropdown)
- Creates a single category

### Bulk Create
- JSON textarea for pasting a nested object or array
- Accepts unlimited nesting depth

### Health
- Shows MongoDB and Redis connection status from the server

---

## Postman Collection

The `postman/` directory contains:

| File | Description |
|------|-------------|
| `Category-API.postman_collection.json` | Complete API collection with all endpoints |
| `category-db.categories.json` | Sample MongoDB seed data |

### Import

1. Open Postman → Import → Upload Files
2. Select `postman/Category-API.postman_collection.json`
3. Set variable `base_url` to `http://localhost:3000`

### Collection Variables

| Variable | Default |
|----------|---------|
| `base_url` | `http://localhost:3000` |
| `categoryId` | Auto-populated after creating a category |
| `childId` | Auto-populated after creating a child |

---

## Design Decisions

### Materialized Path (ancestors array)

Each document stores an `ancestors` array of parent IDs from root to direct parent:

```json
{
  "_id": "abc",
  "name": "Smart Watch",
  "parent": "def",
  "ancestors": ["root_id", "child_id"],
  "isActive": true
}
```

Subtree queries are a single `find({ ancestors: id })` — O(1) queries regardless of depth.

### O(N) Tree Building

`buildTreeDFS()` builds a nested response from flat documents in application memory using an adjacency map (hash by parent ID). Single pass, no recursive DB queries.

### Cascade Rules

- **Deactivate** cascades down to all descendants
- **Activate** affects only the single category and requires the parent to be active (parent guard)
- **Delete** cascades down to all descendants

### Redis Caching

| Cache | TTL | Invalidated On |
|-------|-----|---------------|
| Tree response | 5 min | Any write operation |
| Single category | 10 min | Any write operation |

Redis failures are caught gracefully — the app falls back to MongoDB without crashing.

### Category Model

```json
{
  "_id": "ObjectId",
  "name": "string (globally unique)",
  "parent": "ObjectId | null",
  "ancestors": "ObjectId[]",
  "isActive": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Name uniqueness is enforced globally via a unique index on `name`. Two supporting (non-unique) compound indexes — `{ parent, isActive }` and `{ ancestors, isActive }` — speed up child and subtree lookups.

---

## Project Structure

```
├── client/                  React frontend (Vite + Ant Design)
│   ├── src/
│   │   ├── api/             API client
│   │   ├── components/      Tab components
│   │   ├── types/           TypeScript interfaces
│   │   ├── App.tsx          Layout + tab routing
│   │   └── main.tsx         Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── server/                  Express backend
│   ├── src/
│   │   ├── app.ts           Server entry point
│   │   ├── config/          Environment, DB, Redis config
│   │   ├── models/          Mongoose schema
│   │   ├── repositories/    Database queries
│   │   ├── services/        Business logic + caching
│   │   ├── controllers/     HTTP handlers
│   │   ├── routes/          Route definitions
│   │   ├── middleware/      Validation, caching, error, logger
│   │   ├── utils/           Tree builder, helpers, response formatter
│   │   └── constants/       Message strings
│   ├── docker-compose.yml   Production (MongoDB + Redis + API)
│   ├── docker-compose.dev.yml  Dev databases only
│   ├── Dockerfile
│   └── package.json
│
├── postman/                 Postman collection + seed data
└── README.md

---
```
## Contact

| Field | Details |
|------|---------|
| Name | Sabbir Hossen Ramim |
| Email | shramim13@gmail.com |
| Contact Number | 01845862636 |

``` 

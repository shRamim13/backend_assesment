# Category Management API

REST API for managing hierarchical product categories with unlimited nesting depth, Redis caching, cascade operations, pagination, and one-shot bulk tree creation.

## Tech Stack

| Layer       | Technology              |
|-------------|-------------------------|
| Runtime     | Node.js 18+             |
| Language    | TypeScript 5 (strict)   |
| Framework   | Express 4               |
| Database    | MongoDB 6 + Mongoose    |
| Cache       | Redis 7                 |
| Pattern     | Repository + Service    |
| Infra       | Docker Compose          |

## Features

- **Full CRUD** — create, read, update, delete categories
- **Unlimited nesting** — any depth via materialized path (`ancestors` array)
- **Tree view** — full hierarchy with recursive `children`, optional subtree by `?id=`
- **Flat list** — paginated collection of all categories
- **Search** — case-insensitive regex search with parent + ancestor chain
- **Cascade delete** — delete a category and all its descendants at any level
- **Cascade deactivate** — deactivates a subtree; **activate** un-hides a single category
- **Bulk nested insert** — create a category tree in one POST
- **Upsert** — create or return existing category by name (idempotent)
- **Redis caching** — tree and single-category responses cached; auto-invalidation on writes
- **Pagination** — flat list and search support `?page=&limit=`
- **Health check** — shows MongoDB + Redis connection status
- **Request logger** — color-coded output with duration and cache hit indicator
- **Global error handler** — handles MongoDB duplicate key, validation, cast errors
- **Docker Compose** — one-command startup (API + MongoDB + Redis)

## Quick Start

### Option 1 — Docker (everything included)

```bash
docker-compose up --build
# API at http://localhost:3000
```

### Option 2 — Local dev with Docker for DBs

```bash
npm install
cp .env.example .env
npm run docker:dev        # starts MongoDB + Redis in Docker
npm run dev               # starts API with hot reload
```

### Option 3 — Fully local

```bash
npm install
cp .env.example .env      # fill in MONGO_URI and REDIS_URL
npm run dev
```

## Environment Variables

| Variable        | Description                     | Example                            |
|-----------------|---------------------------------|------------------------------------|
| PORT            | Server port                     | 3000                               |
| MONGO_URI       | MongoDB connection string       | mongodb://localhost:27017/category-db |
| REDIS_URL       | Redis connection string         | redis://localhost:6379             |
| CACHE_TTL_ALL   | Cache TTL for tree (seconds)    | 300                                |
| CACHE_TTL_SINGLE| Cache TTL for single (seconds)  | 600                                |

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

Paginated responses include a `pagination` field:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "...",
  "data": [ ... ],
  "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 },
  "timestamp": "..."
}
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/categories` | Flat list (all / paginated / search) |
| `GET` | `/api/categories/tree` | Full tree or subtree by `?id=` |
| `GET` | `/api/categories/:id` | Single category with ancestor chain |
| `POST` | `/api/categories` | Create single category |
| `POST` | `/api/categories/bulk` | Create category + nested children |
| `PUT` | `/api/categories/:id` | Update name by ID |
| `DELETE` | `/api/categories/:id` | Delete category + all children |
| `PATCH` | `/api/categories/:id/deactivate` | Deactivate + all children (cascade) |
| `PATCH` | `/api/categories/:id/activate` | Activate single category |
| `GET` | `/health` | MongoDB + Redis status |

### Flat list

```
GET /api/categories
```

With pagination:
```
GET /api/categories?page=1&limit=10
```

Search:
```
GET /api/categories?name=watch&page=1&limit=5
```

When no params are given, returns **all** categories (flat, unpaginated).

### Category tree

```bash
# Full tree (cached in Redis)
GET /api/categories/tree

# Subtree rooted at a specific category
GET /api/categories/tree?id=<category_id>
```

Response: Array of `CategoryTreeNode` with recursive `children` property.

### Create category

```bash
POST /api/categories
Content-Type: application/json

# Root category
{ "name": "Electronics" }

# Child category (any nesting level)
{ "name": "Accessories", "parentId": "<parent_id>" }
```

### Bulk create (one-shot nested tree)

```bash
POST /api/categories/bulk
Content-Type: application/json

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
        { "name": "Local", "children": [
          { "name": "Lungi" },
          { "name": "Panjabi" }
        ]}
      ]
    },
    {
      "name": "Women",
      "children": [
        { "name": "Western", "children": [
          { "name": "Top" },
          { "name": "Jeans" }
        ]},
        { "name": "Local", "children": [
          { "name": "Saree" },
          { "name": "Lehenga" }
        ]}
      ]
    }
  ]
}
```

Supports unlimited nesting depth — `children` are recursively created.

### Update name

```bash
PUT /api/categories/:id
Content-Type: application/json

{ "name": "Updated Name" }
```

### Delete (cascade)

```bash
DELETE /api/categories/:id
```

Deletes the category and **all** its descendants at any depth.

### Deactivate (Cascade) / Activate

```bash
PATCH /api/categories/:id/deactivate
PATCH /api/categories/:id/activate
```

**Deactivate** toggles `isActive` to false on the category and **all** descendants.
**Activate** toggles `isActive` to true on a **single** category (ensuring its parent is active).

### Health check

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "environment": "production",
  "uptime": "120s",
  "services": {
    "mongodb": "connected",
    "redis": "connected"
  },
  "timestamp": "..."
}
```

## Architecture

```
src/
├── app.ts                     # Entry point, middleware chain, graceful shutdown
├── config/
│   ├── env.config.ts          # Validates and exports environment variables
│   ├── db.config.ts           # MongoDB connection (Mongoose)
│   └── redis.config.ts        # Redis connection (node-redis)
├── types/
│   └── category.types.ts      # All TypeScript interfaces and DTOs
├── models/
│   └── category.model.ts      # Mongoose schema with indexes
├── repositories/
│   └── category.repository.ts # Database queries only (lean, single-purpose)
├── services/
│   ├── category.service.ts    # Business logic (cascade, tree, bulk, cache)
│   └── cache.service.ts       # Redis get/set/invalidate abstraction
├── controllers/
│   └── category.controller.ts # HTTP handlers (parse, call service, respond)
├── routes/
│   └── category.routes.ts     # Route definitions + middleware wiring
├── middleware/
│   ├── validate.middleware.ts # Request validation
│   ├── cache.middleware.ts    # Redis cache (GET /:id)
│   ├── error.middleware.ts    # Global error handler
│   └── logger.middleware.ts   # Colored request logging
├── utils/
│   ├── helpers.ts             # createError(), buildAncestorChain()
│   ├── dfs.util.ts            # buildTreeDFS(), collectDescendantIdsDFS()
│   └── response.util.ts       # ResponseBuilder (success, paginated, error)
└── constants/
    └── messages.ts            # All string constants (ERR, MSG)
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

## Design Decisions

### Materialized Path Pattern

Each document stores an `ancestors` array containing IDs of all parent categories from root to direct parent. All subtree queries use a single filter: `find({ ancestors: id })` — O(1) DB queries regardless of depth.

```json
{
  "_id": "abc",
  "name": "Smart Watch",
  "parent": "def",
  "ancestors": ["root_id", "child_id", "grandchild_id"],
  "isActive": true
}
```

### DFS for Tree Building and Cascade

- **Recursive**: `buildTreeDFS()` builds nested tree response from flat documents in application memory
- **Iterative (stack-based)**: `collectDescendantIdsDFS()` prevents call stack overflow on very deep trees during cascade operations

### Repository Pattern

All MongoDB queries isolated in repository layer. Service layer contains business logic only. Makes each layer independently testable.

### Redis Caching

- **Tree response** cached 5 min, invalidated on any write
- **Single category** cached 10 min, invalidated on any write
- Cache middleware (`GET /:id`) intercepts before controller — returns cached data without hitting service/repo
- Redis failures caught gracefully — app falls back to MongoDB without crashing

### Cascade Operations

Deactivate and delete follow a cascading pattern:
1. Find category
2. Find all descendants via `ancestors` index
3. Collect IDs via iterative DFS
4. Single `updateMany` / `deleteMany` with all IDs

*Note: Activate operates only on the single category and verifies parent status, it does not cascade.*

## Postman Collection

Import `postman/Category-API.postman_collection.json` into Postman, or use the Bruno collection in `postman/bruno/`.

Set `base_url` variable to `http://localhost:3000`.

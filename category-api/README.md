# Category Management API

REST API for managing hierarchical product categories with unlimited nesting depth, Redis caching, and cascade deactivation.

## Tech Stack

| Layer       | Technology              |
|-------------|-------------------------|
| Runtime     | Node.js 18+             |
| Language    | TypeScript 5            |
| Framework   | Express 4               |
| API         | REST                    |
| Database    | MongoDB 6 + Mongoose    |
| Cache       | Redis 7                 |
| Pattern     | Repository + Service    |
| Infra       | Docker Compose          |

## Features

- CRUD for categories with **unlimited nesting depth**
- Full ancestor chain returned in every category detail response
- **Search categories** with parent category in response
- **Cascade deactivation** of all child categories
- **Materialized path pattern** — all subtree operations in O(1) DB queries
- **Redis caching** with automatic invalidation on any mutation
- Request logger with color-coded output and cache hit indicator
- Health check endpoint showing MongoDB + Redis status
- Docker Compose for one-command setup

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
| CACHE_TTL_ALL   | Cache TTL for list (seconds)   | 300                                |
| CACHE_TTL_SINGLE| Cache TTL for single (seconds) | 600                                |

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

### List all categories (nested tree)

```
GET /api/categories
```

Response: Array of `CategoryTreeNode` with recursive `children` property.

### Get single category (with parent chain)

```
GET /api/categories/:id
```

Response includes `parentCategory` (direct parent) and `ancestorChain` (full path from root).

### Search categories

```
GET /api/categories/search?q=watch
```

Searches by name (case-insensitive regex). Every result includes `parentCategory` and `ancestorChain`.

### Create category

```
POST /api/categories
Content-Type: application/json

{ "name": "Electronics" }
```

With parent:
```json
{ "name": "Accessories", "parentId": "<parent_id>" }
```

### Update category

```
PUT /api/categories/:id
Content-Type: application/json

{ "name": "Updated Name" }
```

### Delete category

```
DELETE /api/categories/:id
```

Only leaf categories (no children) can be deleted.

### Deactivate category (cascading)

```
PATCH /api/categories/:id/deactivate
```

Deactivates the category and **all** its descendants automatically.

### Activate category

```
PATCH /api/categories/:id/activate
```

### Health check

```
GET /health
```

Returns MongoDB + Redis connection status.

## Test Flow

```bash
# 1. Create root
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Electronics"}'

# 2. Create child (replace <id> with Electronics _id)
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Accessories", "parentId": "<id>"}'

# 3. Create grandchild
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Wearable", "parentId": "<child_id>"}'

# 4. Create great-grandchild
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Smart Watch", "parentId": "<grandchild_id>"}'

# 5. Get all (nested tree)
curl http://localhost:3000/api/categories

# 6. Get single with ancestor chain
curl http://localhost:3000/api/categories/<smartwatch_id>

# 7. Search (parent + ancestor chain in response)
curl "http://localhost:3000/api/categories/search?q=watch"

# 8. Deactivate (cascades to all children)
curl -X PATCH http://localhost:3000/api/categories/<child_id>/deactivate

# 9. Activate
curl -X PATCH http://localhost:3000/api/categories/<child_id>/activate
```

## Design Decisions

### Materialized Path Pattern
Each document stores an `ancestors` array containing IDs of all parent categories from root to direct parent. This enables all subtree queries and cascade operations in a single MongoDB query regardless of depth — solving the N+1 query problem.

### DFS for Tree Building and Cascade
Recursive DFS builds the nested tree response from flat MongoDB documents in application memory (zero DB cost). Iterative stack-based DFS prevents call stack overflow on very deep trees.

### Repository Pattern
All MongoDB queries are isolated in the repository layer. The service layer contains only business logic. This makes each layer independently testable.

### Redis Caching Strategy
GET responses are cached with configurable TTL. Any mutation clears all category cache keys. Redis failures are caught gracefully — the app falls back to MongoDB without crashing.

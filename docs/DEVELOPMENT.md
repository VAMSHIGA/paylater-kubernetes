# PayLater — Developer Guide

This document explains how to work on the PayLater codebase: project layout, local setup, SQLC, Docker, and the day-to-day workflow.

---

## Project layout

PayLater is a **monorepo** with one API Gateway and six microservices. Each service is a separate Go module; cross-cutting code lives in `shared/`.

```text
Handler  → validates HTTP input, maps status codes
Service  → business rules (no SQL, no Gin types)
Repository → thin wrapper around SQLC queries
SQLC     → generated type-safe database access
MySQL    → one database per service (database-per-service pattern)
```

The API Gateway (`main.go` at repo root) has **no database** and **no JWT validation**. It only reverse-proxies to microservices.

---

## Microservice communication

| Pattern | Used in PayLater? |
|---------|-------------------|
| Client → Gateway → Service | Yes (all public APIs) |
| Service → Service (HTTP) | No |
| Shared database | No (each service owns its DB) |
| Reporting snapshot sync | Yes (Reporting Service copies domain DBs into `report_db`) |

Cross-entity IDs (`customer_id`, `merchant_id`) are stored as plain values without cross-database foreign keys.

---

## Database ownership

| Service | Database | Owns |
|---------|----------|------|
| Identity | `identity_db` | `users` |
| Customer | `customer_db` | `customers` |
| Merchant | `merchant_db` | `merchants` |
| Transaction | `transaction_db` | `transactions` |
| Payback | `payback_db` | `paybacks` |
| Reporting | `report_db` | Snapshot copies of the four domain tables |

Reporting reads **only** from `report_db`. The `internal/sync` package refreshes the snapshot from domain databases on startup and before each report query.

---

## Prerequisites

- Go **1.25.1**
- MySQL **8.4**
- [sqlc](https://sqlc.dev/) (for regenerating query code)
- Docker & Docker Compose (optional, for containerized runs)

---

## Running locally (without Docker)

### 1. Create databases

Run each service migration script against MySQL:

```bash
mysql -u root -p < identity-service/docs/migrations/001_create_identity_database.sql
mysql -u root -p < customer-service/docs/migrations/001_create_customer_database.sql
# ... repeat for merchant, transaction, payback, reporting
```

### 2. Configure environment

Copy `.env.example` inside each service directory you plan to run:

```bash
cp identity-service/.env.example identity-service/.env
```

Required variables (see `shared/constants/constants.go`):

| Variable | Purpose |
|----------|---------|
| `HTTP_PORT` | Service listen port (8081–8086) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `JWT_SECRET` | Must match across all services that sign or validate tokens |

### 3. Build and run

From the repository root:

```bash
# Gateway
go run .

# Each microservice (in separate terminals)
cd identity-service && go run ./cmd/server
cd customer-service && go run ./cmd/server
# ... etc.
```

Point the gateway at local services via env vars (`IDENTITY_SERVICE_URL=http://localhost:8081`, etc.) or rely on defaults in `config/gateway.go`.

---

## SQLC code generation

Each microservice has its own `sqlc.yaml`. Generated code lives in `db/sqlc/` — **do not edit by hand**.

### Workflow

1. Edit `db/schema/schema.sql` (DDL) or `db/queries/*.sql` (queries).
2. Regenerate from the service directory:

```bash
cd customer-service
sqlc generate
```

3. Rebuild the service: `go build ./cmd/server`

### SQLC locations

| Service | Config | Queries | Generated |
|---------|--------|---------|-----------|
| Identity | `identity-service/sqlc.yaml` | `db/queries/auth.sql` | `db/sqlc/` |
| Customer | `customer-service/sqlc.yaml` | `db/queries/customer.sql` | `db/sqlc/` |
| Merchant | `merchant-service/sqlc.yaml` | `db/queries/merchant.sql` | `db/sqlc/` |
| Transaction | `transaction-service/sqlc.yaml` | `db/queries/transaction.sql` | `db/sqlc/` |
| Payback | `payback-service/sqlc.yaml` | `db/queries/payback.sql` | `db/sqlc/` |
| Reporting | `reporting-service/sqlc.yaml` | `db/queries/report.sql` | `db/sqlc/` |

---

## Docker usage

### Build images

```bash
docker compose build
```

Individual image:

```bash
docker build -f identity-service/Dockerfile -t paylater-identity-service .
```

### Run the full stack

Create a root `.env` with at least:

```env
MYSQL_ROOT_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
```

Then:

```bash
docker compose up -d
docker compose ps
docker compose logs -f reporting-service
```

### Ports

| Service | Port |
|---------|------|
| API Gateway | 8080 |
| Identity | 8081 |
| Customer | 8082 |
| Merchant | 8083 |
| Transaction | 8084 |
| Payback | 8085 |
| Reporting | 8086 |
| MySQL | 3306 |

---

## API testing

1. Register: `POST http://localhost:8080/auth/register`
2. Login: `POST http://localhost:8080/auth/login` → copy `token`
3. Call protected APIs with header: `Authorization: Bearer <token>`

Report endpoints require an **admin** role.

---

## Shared module (`paylater/shared`)

Imported by all six microservices via:

```go
require paylater/shared v0.0.0
replace paylater/shared => ../shared
```

See `shared/README.md` for package responsibilities.

---

## Code style

- Run `gofmt` before committing: `gofmt -w .`
- Keep handlers thin; put rules in the service layer.
- Keep SQL in `db/queries/`; never embed raw SQL in Go except reporting snapshot sync.
- Match existing naming and layer boundaries when adding features.

---

## Additional documentation

| Document | Location |
|----------|----------|
| Root overview | `README.md` |
| Shared module | `shared/README.md` |
| Reporting snapshot | `reporting-service/docs/DATABASE_OWNERSHIP.md` |
| Per-service README | `<service>/README.md` |

# PayLater

A **Go microservices** backend for a Pay Later credit platform. Customers can make purchases on credit, merchants can be onboarded with commission rates, repayments can be recorded, and administrators can run aggregate reports—all exposed through a single API Gateway entry point.

---

## Project Overview

**PayLater** is a backend system that supports:

- **User accounts** with role-based access (`admin`, `customer`, `merchant`)
- **Customer credit profiles** with configurable credit limits
- **Merchant onboarding** and commission management
- **PayLater transactions** (purchases on credit)
- **Paybacks** (customer repayments)
- **Admin reporting** from a dedicated read-model database

The system follows a **strangler-pattern API Gateway** architecture: clients send all requests to one gateway (`:8080`), which reverse-proxies each route to the owning microservice. Each service owns its MySQL database. Cross-cutting concerns (configuration, database connectivity, JWT, middleware, responses) live in the shared module `paylater/shared`.

**Business purpose:** Enable a “buy now, pay later” workflow where customers purchase from merchants on credit, repay over time, and administrators monitor fees, dues, and credit utilization.

---

## Features

| Feature | Description |
|---------|-------------|
| **User Registration** | Public `POST /auth/register` with email, password, and role |
| **Login** | Public `POST /auth/login` returns a JWT access token |
| **JWT Authentication** | HS256 tokens (24h expiry); validated per service via `shared/middleware` |
| **Role-Based Authorization** | Routes restricted to `admin`, `customer`, and/or `merchant` |
| **Customer Management** | Admin-only create and list customers |
| **Merchant Management** | Create merchants (admin/merchant); update commission (admin) |
| **Transaction Management** | Record PayLater purchases (admin/customer) |
| **Payback Management** | Record customer repayments (admin/customer) |
| **Reporting** | Four admin GET reports from `report_db` snapshot |
| **API Gateway** | Single HTTP entry on `:8080`; proxies to six microservices |
| **Docker Support** | Multi-stage Dockerfiles for all services + `docker-compose.yml` |

---

## Project Architecture

### Microservices overview

```text
Client / Postman
       |
       v
+------------------+
|   API Gateway    |  :8080  (no database, no JWT validation)
+--------+---------+
         |
         +-- /auth/*              --> Identity Service     :8081  (identity_db)
         +-- /customers*          --> Customer Service     :8082  (customer_db)
         +-- /merchants*          --> Merchant Service     :8083  (merchant_db)
         +-- /transactions*       --> Transaction Service  :8084  (transaction_db)
         +-- /paybacks*           --> Payback Service      :8085  (payback_db)
         +-- /reports/*           --> Reporting Service    :8086  (report_db)
```

Each microservice uses the same layered layout:

```text
HTTP (Gin router + shared middleware on protected routes)
  → handler     (request validation, HTTP mapping)
  → service     (business rules)
  → repository  (SQLC wrapper)
  → MySQL       (service-owned database)
```

Services **do not call each other over HTTP**. Cross-entity IDs (e.g. `customer_id`, `merchant_id`) are stored as plain values without cross-database foreign keys.

### API Gateway

- **Entry point:** `main.go` at the repository root (`module paylater`)
- **Port:** `:8080` (hard-coded in `main.go`)
- **Responsibilities:** Reverse-proxy only via `routes/*_proxy.go`
- **Does not:** Validate JWT, connect to MySQL, or run domain logic
- **Upstream URLs:** Resolved from environment variables in `config/gateway.go`
- **Auth:** The `Authorization` header is forwarded unchanged; each destination service enforces authentication

### Shared module (`paylater/shared`)

Imported by all six microservices via `replace paylater/shared => ../shared` in each service `go.mod`.

| Package | Role |
|---------|------|
| `config` | Load `HTTP_PORT`, `DB_*`, `JWT_SECRET` from environment |
| `database` | MySQL connection with `parseTime=true` |
| `jwt` | HS256 token generation (Identity) and validation (middleware) |
| `middleware` | `AuthMiddleware` + `AuthorizeRoles` |
| `response` | Stable `{"error"}` / `{"message"}` JSON responses |
| `validator` | `YYYY-MM-DD` date parsing |
| `utils` | DECIMAL / `[]byte` to string (Reporting) |
| `constants` | Roles, headers, context keys, env var names |
| `errors` | Sentinel errors for config and auth |
| `logger` | Thin logging helper |

`JWT_SECRET` must be **identical** on Identity Service (signing) and every service that validates tokens.

### Database per service

| Service | Database | Tables (from `001_create_*_database.sql`) |
|---------|----------|-------------------------------------------|
| Identity | `identity_db` | `users` |
| Customer | `customer_db` | `customers` |
| Merchant | `merchant_db` | `merchants` |
| Transaction | `transaction_db` | `transactions` |
| Payback | `payback_db` | `paybacks` |
| Reporting | `report_db` | `customers`, `merchants`, `transactions`, `paybacks` (snapshot) |

`report_db` is a **read-model snapshot**. The Reporting Service refreshes it from domain databases (`customer_db`, `merchant_db`, `transaction_db`, `payback_db`) via `reporting-service/internal/sync` on startup and before each report request. SQLC report queries read only from `report_db`.

See `docs/DEVELOPMENT.md` for the full developer workflow and `reporting-service/docs/DATABASE_OWNERSHIP.md` for snapshot details.

---

## Folder Structure

```text
paylater/
├── main.go                      # API Gateway entry point
├── Dockerfile                   # API Gateway container image
├── docker-compose.yml           # Full stack orchestration (gateway-only host ports)
├── docker-compose.dev.yml       # Dev overrides (MySQL + microservice host ports)
├── .dockerignore                # Docker build context filter
├── go.mod / go.sum              # Root module (gateway)
├── config/
│   └── gateway.go               # Upstream service URL resolution
├── routes/
│   ├── auth_proxy.go            # Proxy /auth/*
│   ├── customer_proxy.go        # Proxy /customers
│   ├── merchant_proxy.go        # Proxy /merchants
│   ├── transaction_proxy.go     # Proxy /transactions
│   ├── payback_proxy.go         # Proxy /paybacks
│   └── report_proxy.go          # Proxy /reports/*
├── shared/                      # Shared Go module (paylater/shared)
│   ├── config/                  # Env-based configuration
│   ├── database/                # MySQL connector
│   ├── jwt/                     # JWT sign/validate
│   ├── middleware/              # Auth + role checks
│   ├── response/                # JSON response helpers
│   ├── validator/               # Date validation
│   ├── utils/                   # Reporting helpers
│   ├── constants/               # Shared literals
│   ├── errors/                  # Sentinel errors
│   ├── logger/                  # Logging
│   ├── go.mod / go.sum
│   └── README.md
├── identity-service/            # Auth: register, login, JWT issuance
├── customer-service/            # Customer create/list (admin)
├── merchant-service/            # Merchant create, commission update
├── transaction-service/         # PayLater purchase records
├── payback-service/             # Customer repayment records
└── reporting-service/           # Admin aggregate reports
```

### Typical microservice layout

```text
<service>/
├── Dockerfile                   # Multi-stage build (context: repo root)
├── cmd/server/main.go           # Process entry; wires layers
├── internal/
│   ├── handler/                 # HTTP adapters
│   ├── service/                 # Business logic
│   ├── repository/              # SQLC wrappers
│   └── router/                  # Routes + middleware
├── db/
│   ├── schema/schema.sql        # Owned MySQL DDL
│   ├── queries/*.sql            # Hand-written SQL for SQLC
│   └── sqlc/                    # Generated code (do not edit)
├── docs/migrations/
│   └── 001_create_*_database.sql
├── sqlc.yaml                    # SQLC configuration
├── .env.example                 # Environment template
└── README.md
```

---

## Technologies Used

| Technology | Usage |
|------------|-------|
| **Go (Golang) 1.25.1** | All services and the API Gateway |
| **Gin Framework** | HTTP routing and middleware |
| **MySQL 8.4** | Persistent storage (one database per service) |
| **SQLC** | Type-safe Go code generated from SQL queries |
| **JWT (HS256)** | Stateless authentication (`github.com/golang-jwt/jwt/v5`) |
| **bcrypt** | Password hashing (Identity Service) |
| **Docker** | Multi-stage images (`golang:1.25.1-alpine` → `alpine:3.21`) |
| **Docker Compose** | MySQL + 7 application services |
| **Git** | Version control |

---

## Request Flow

```text
Client
  │
  ▼
API Gateway (:8080)
  │  httputil.ReverseProxy forwards method, path, headers
  ▼
Microservice (Gin router)
  │  AuthMiddleware → AuthorizeRoles (protected routes)
  ▼
Handler
  │  JSON binding + validation
  ▼
Service Layer
  │  Business rules
  ▼
Repository Layer
  │  SQLC query calls
  ▼
SQLC (generated)
  ▼
MySQL (service-owned database)
  │
  ▼
Response (JSON) back through the same chain
```

---

## Authentication Flow

### Registration

1. Client sends `POST /auth/register` (public) via the gateway.
2. Identity Service validates email, password (min 6 chars), and role (`customer`, `merchant`, or `admin`).
3. Password is hashed with **bcrypt** and stored in `identity_db.users`.

### Login

1. Client sends `POST /auth/login` (public) via the gateway.
2. Identity Service verifies email and bcrypt password hash.
3. On success, returns a JWT access token.

### JWT generation

- Signed by Identity Service using `shared/jwt` with **HS256**
- Secret: `JWT_SECRET` environment variable
- Expiry: **24 hours**
- Claims: `user_id`, `email`, `role`

### JWT validation

- Protected microservices use `shared/middleware.AuthMiddleware`
- Expects header: `Authorization: Bearer <token>`
- Validates signature and expiry; stores `user_id`, `email`, `role` in Gin context

### Authorization

- `shared/middleware.AuthorizeRoles` checks the caller's role against allowed roles for the route
- Returns **401** for missing/invalid token; **403** for valid token but insufficient role

---

## Docker Architecture

| Component | Role in PayLater |
|-----------|------------------|
| **Docker Client** | CLI you use (`docker build`, `docker run`, `docker compose`) |
| **Docker Daemon** | Builds images and runs containers on the host |
| **Docker Host** | The machine running the Docker engine (your laptop or server) |
| **Docker Registry** | Stores base images (e.g. Docker Hub: `golang`, `mysql`, `alpine`) |
| **Docker Images** | Immutable templates: `paylater-api-gateway`, `paylater-identity-service`, etc. |
| **Docker Containers** | Running instances: `paylater-gateway`, `paylater-mysql`, `paylater-identity`, etc. |

Each application image uses a **multi-stage build**:

1. **Builder stage:** `golang:1.25.1-alpine` compiles a static Go binary.
2. **Runtime stage:** `alpine:3.21` copies only the compiled binary (+ `ca-certificates`).

Microservice images are built from the **repository root** so the `paylater/shared` local module (`replace => ../shared`) resolves correctly.

---

## Docker Compose

`docker-compose.yml` defines **8 services** on the `paylater-network` network.

### Port exposure (production-style vs development)

The base `docker-compose.yml` is hardened for deployment: **only the API Gateway (`8080`) is published to the host**. MySQL and all microservices communicate on the internal Docker network only.

For local development (host MySQL access, direct service debugging), use the optional override file:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

| Configuration | Host ports | Use case |
|---------------|------------|----------|
| `docker-compose.yml` only | `8080` (gateway) | Production-style / minimal exposure |
| `+ docker-compose.dev.yml` | `8080`, `3308` (MySQL), `8081`–`8086` | Local dev, integration tests, admin bootstrap |

### Services

| Compose service | Container | Internal port | Host port (base) | Host port (dev override) | Docker Hub image |
|-----------------|-----------|---------------|------------------|--------------------------|------------------|
| `mysql` | `paylater-mysql` | 3306 | — | `${MYSQL_PORT:-3308}` | `mysql:8.4` |
| `identity-service` | `paylater-identity` | 8081 | — | 8081 | `galinkivamshi/paylater-identity-service:latest` |
| `customer-service` | `paylater-customer` | 8082 | — | 8082 | `galinkivamshi/paylater-customer-service:latest` |
| `merchant-service` | `paylater-merchant` | 8083 | — | 8083 | `galinkivamshi/paylater-merchant-service:latest` |
| `transaction-service` | `paylater-transaction` | 8084 | — | 8084 | `galinkivamshi/paylater-transaction-service:latest` |
| `payback-service` | `paylater-payback` | 8085 | — | 8085 | `galinkivamshi/paylater-payback-service:latest` |
| `reporting-service` | `paylater-reporting` | 8086 | — | 8086 | `galinkivamshi/paylater-reporting-service:latest` |
| `api-gateway` | `paylater-gateway` | 8080 | 8080 | 8080 | `galinkivamshi/paylater-api-gateway:latest` |

MySQL mounts each service's `docs/migrations/001_create_*_database.sql` into `/docker-entrypoint-initdb.d/` to create all six databases and tables on first start.

### Networks

- **`paylater-network`** — all services communicate using Docker DNS service names (e.g. `http://identity-service:8081`).

### Volumes

- **`mysql_data`** — persistent MySQL data at `/var/lib/mysql`.

### Environment variables (Compose)

Create a `.env` file in the repository root before running Compose:

```env
MYSQL_ROOT_PASSWORD=your_secure_mysql_password
JWT_SECRET=your_secure_jwt_secret
DB_USER=root
MYSQL_PORT=3308
```

Microservices receive `DB_HOST=mysql`, `DB_PASSWORD=${MYSQL_ROOT_PASSWORD}`, and `JWT_SECRET` from Compose. The gateway receives `*_SERVICE_URL` values pointing at Docker service hostnames.

### Security hardening

| Control | Implementation |
|---------|----------------|
| **Port exposure** | Base compose publishes only gateway `:8080`; dev override adds MySQL/microservice ports |
| **Internal networking** | All services on `paylater-network`; inter-service URLs use Docker DNS (`mysql`, `identity-service`, etc.) |
| **Container users** | Go services run as non-root `appuser` (UID 10001) in Alpine runtime images |
| **Secrets** | `MYSQL_ROOT_PASSWORD`, `JWT_SECRET` supplied via `.env` (gitignored); never committed |
| **Healthchecks** | MySQL `mysqladmin ping`; Go services `GET /health` via `wget` |
| **Startup order** | `depends_on` with `condition: service_healthy` for MySQL and gateway upstreams |
| **Restart policy** | `unless-stopped` on all services (survives daemon restart; does not restart on manual stop) |
| **Data persistence** | Named volume `mysql_data`; no destructive volume commands in compose |

---

## API Endpoints

Base URL (local): `http://localhost:8080`

Protected endpoints require:

```text
Authorization: Bearer <JWT>
```

### Identity Service (via gateway)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register user (`email`, `password`, `role`) |
| POST | `/auth/login` | Public | Login; returns JWT |

### Customer Service

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/customers` | Admin | Create customer |
| GET | `/customers` | Admin | List all customers |

### Merchant Service

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/merchants` | Admin, Merchant | Onboard merchant |
| PUT | `/merchants/:id` | Admin | Update merchant commission |

### Transaction Service

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/transactions` | Admin, Customer | Record PayLater purchase |

### Payback Service

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/paybacks` | Admin, Customer | Record customer repayment |

### Reporting Service

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/reports/merchant-fees` | Admin | Merchant fee report |
| GET | `/reports/customer-dues` | Admin | Customer dues report |
| GET | `/reports/credit-limit` | Admin | Users at credit limit |
| GET | `/reports/total-dues` | Admin | Total outstanding dues |

---

## Environment Variables

### API Gateway

Resolved by `config/gateway.go`. Full URL takes priority over host/port pairs.

| Variable | Description | Default |
|----------|-------------|---------|
| `IDENTITY_SERVICE_URL` | Identity Service base URL | — |
| `IDENTITY_SERVICE_HOST` | Identity host (if URL unset) | `localhost` |
| `IDENTITY_SERVICE_PORT` | Identity port (if URL unset) | `8081` |
| `CUSTOMER_SERVICE_URL` | Customer Service base URL | — |
| `CUSTOMER_SERVICE_HOST` | Customer host | `localhost` |
| `CUSTOMER_SERVICE_PORT` | Customer port | `8082` |
| `MERCHANT_SERVICE_URL` | Merchant Service base URL | — |
| `MERCHANT_SERVICE_HOST` | Merchant host | `localhost` |
| `MERCHANT_SERVICE_PORT` | Merchant port | `8083` |
| `TRANSACTION_SERVICE_URL` | Transaction Service base URL | — |
| `TRANSACTION_SERVICE_HOST` | Transaction host | `localhost` |
| `TRANSACTION_SERVICE_PORT` | Transaction port | `8084` |
| `PAYBACK_SERVICE_URL` | Payback Service base URL | — |
| `PAYBACK_SERVICE_HOST` | Payback host | `localhost` |
| `PAYBACK_SERVICE_PORT` | Payback port | `8085` |
| `REPORTING_SERVICE_URL` | Reporting Service base URL | — |
| `REPORTING_SERVICE_HOST` | Reporting host | `localhost` |
| `REPORTING_SERVICE_PORT` | Reporting port | `8086` |

### Microservices (via `shared/config`)

| Variable | Required | Description |
|----------|----------|-------------|
| `HTTP_PORT` | No | Listen port (defaults: 8081–8086 per service) |
| `DB_HOST` | Yes | MySQL host |
| `DB_PORT` | Yes | MySQL port |
| `DB_USER` | Yes | MySQL user |
| `DB_PASSWORD` | No* | MySQL password |
| `DB_NAME` | Yes | Service database name |
| `JWT_SECRET` | Yes | Shared JWT signing/validation secret |

\*`DB_PASSWORD` may be empty, but `DB_HOST`, `DB_PORT`, `DB_USER`, and `DB_NAME` are required.

### Docker Compose (root `.env`)

| Variable | Description |
|----------|-------------|
| `MYSQL_ROOT_PASSWORD` | MySQL root password (used by all services as `DB_PASSWORD`) |
| `JWT_SECRET` | Shared JWT secret for all microservices |
| `DB_USER` | MySQL user (default: `root`) |
| `MYSQL_PORT` | Host port for MySQL (default: `3308` in `.env.example`) |
| `APP_VERSION` | Docker image tag for application services (default: `latest`) |

Do not commit `.env` files. Use `.env.example` in each service as a template.

---

## How to Run Locally

### Prerequisites

- Go **1.25.1+**
- MySQL **8.x**
- Git

### 1. Clone the repository

```bash
git clone <repository-url>
cd paylater
```

### 2. Create databases

Run each service's bootstrap migration against MySQL:

```bash
mysql -u root -p < identity-service/docs/migrations/001_create_identity_database.sql
mysql -u root -p < customer-service/docs/migrations/001_create_customer_database.sql
mysql -u root -p < merchant-service/docs/migrations/001_create_merchant_database.sql
mysql -u root -p < transaction-service/docs/migrations/001_create_transaction_database.sql
mysql -u root -p < payback-service/docs/migrations/001_create_payback_database.sql
mysql -u root -p < reporting-service/docs/migrations/001_create_report_database.sql
```

### 3. Configure environment

Copy `.env.example` to `.env` in each microservice directory and set `DB_*` and `JWT_SECRET` (same secret everywhere).

For the gateway, set upstream URLs (example root `.env`):

```env
IDENTITY_SERVICE_URL=http://localhost:8081
CUSTOMER_SERVICE_URL=http://localhost:8082
MERCHANT_SERVICE_URL=http://localhost:8083
TRANSACTION_SERVICE_URL=http://localhost:8084
PAYBACK_SERVICE_URL=http://localhost:8085
REPORTING_SERVICE_URL=http://localhost:8086
```

### 4. Build

```bash
cd shared && go build ./...
cd ../identity-service && go build ./...
cd ../customer-service && go build ./...
cd ../merchant-service && go build ./...
cd ../transaction-service && go build ./...
cd ../payback-service && go build ./...
cd ../reporting-service && go build ./...
cd .. && go build .
```

### 5. Run (separate terminals; start microservices before the gateway)

```bash
cd identity-service && go run ./cmd/server
cd customer-service && go run ./cmd/server
cd merchant-service && go run ./cmd/server
cd transaction-service && go run ./cmd/server
cd payback-service && go run ./cmd/server
cd reporting-service && go run ./cmd/server

# From repo root
go run .
```

Gateway: **http://localhost:8080**

### 6. Test

#### Backend unit tests

```bash
cd shared && go test ./... -count=1
cd ../identity-service && go test ./... -count=1
cd ../customer-service && go test ./... -count=1
cd ../merchant-service && go test ./... -count=1
cd ../transaction-service && go test ./... -count=1
cd ../payback-service && go test ./... -count=1
cd ../reporting-service && go test ./... -count=1
cd .. && go test ./... -count=1
```

#### Backend integration tests (MySQL required)

Integration tests use isolated `paylater_it_*` transaction/payback databases and require a running MySQL instance.

```bash
export INTEGRATION_TEST_MYSQL_HOST=127.0.0.1
export INTEGRATION_TEST_MYSQL_PORT=3308
export INTEGRATION_TEST_MYSQL_PASSWORD=your_mysql_root_password

cd transaction-service && go test -tags=integration ./internal/repository -count=1
cd ../payback-service && go test -tags=integration ./internal/repository -count=1
```

If MySQL is unavailable, integration tests are skipped locally but **CI fails** when MySQL cannot be reached.

#### Frontend tests

```bash
cd paylater-frontend
npm ci
npm run test -- --run
npm run build
npm run lint
```

#### Docker Compose validation

```bash
docker compose config -q
```

#### CI

GitHub Actions workflow: `.github/workflows/ci.yml`

Runs on every push and pull request:

- backend unit tests and builds for all Go modules
- MySQL-backed integration tests (`-tags=integration`)
- frontend test/build/lint
- `docker compose config -q`
- OpenAPI validation (`docs/openapi.yaml` via `@redocly/cli`)

#### API documentation

OpenAPI 3.0 specification: [`docs/openapi.yaml`](docs/openapi.yaml)

Describes the API Gateway contract at `http://localhost:8080`, including authentication, customers, merchants, transactions, paybacks, reports, and JWT bearer security.

#### Public registration and login

Public `POST /auth/register` accepts **customer** and **merchant** roles only. Admin self-registration is forbidden.

```bash
# Customer registration
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"secret12","role":"customer"}'

# Admin self-registration is rejected
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret12","role":"admin"}'
# -> 403 "You are not authorized to register as admin"
```

#### Provision the first admin (operator only)

Use the Identity Service bootstrap command. This is **not** exposed over HTTP.

```bash
cd identity-service

export DB_HOST=127.0.0.1
export DB_PORT=3308
export DB_USER=root
export DB_PASSWORD=your_mysql_root_password
export DB_NAME=identity_db
export JWT_SECRET=your_jwt_secret

export ADMIN_BOOTSTRAP_EMAIL=admin@example.com
export ADMIN_BOOTSTRAP_PASSWORD='choose-a-strong-password'

go run ./cmd/admin-bootstrap
```

Or pass flags explicitly:

```bash
go run ./cmd/admin-bootstrap \
  --email admin@example.com \
  --password 'choose-a-strong-password'
```

The command validates email/password, bcrypt-hashes the password, creates `role=admin`, and never prints the password. If the email already exists, it exits with `admin user already exists`.

```bash
# Login after bootstrap
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"choose-a-strong-password"}'
```

Use the returned token for protected endpoints: `Authorization: Bearer <token>`.

---

## How to Run with Docker

### Prerequisites

- Docker Engine
- Docker Compose plugin (`docker compose`)
- No Go installation required — application images are published on Docker Hub

### Quick start (clone + pull)

```bash
git clone https://github.com/VAMSHIGA/paylater-microservices-docker.git
cd paylater-microservices-docker

# Required: create .env BEFORE running docker compose pull or up
cp .env.example .env
```

Edit `.env` and replace the placeholder values with your own secrets:

```env
MYSQL_ROOT_PASSWORD=your_secure_mysql_password
JWT_SECRET=your_secure_jwt_secret
DB_USER=root
MYSQL_PORT=3308
```

Then pull and start the published images (no local build required):

```bash
# Production-style (gateway only on host)
docker compose pull   # optional — `docker compose up -d` also pulls automatically
docker compose up -d

# Local development (also exposes MySQL :3308 and microservice ports)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

docker compose ps
```

Gateway: **http://localhost:8080**

Verify health:

```bash
curl http://localhost:8080/health
# {"status":"ok"}
```

> **Important:** If you run `docker compose pull` or `docker compose up` **before** creating `.env`, Compose will warn that `MYSQL_ROOT_PASSWORD` and `JWT_SECRET` are not set. This is expected — create `.env` first.

### Build from source (optional, for developers)

```bash
# With dev port overrides (recommended for local work)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

---

## Docker Compose Commands

```bash
# Pull published images and start (recommended)
docker compose pull
docker compose up -d

# Stop and remove containers
docker compose down

# View logs (all services)
docker compose logs

# Follow logs
docker compose logs -f

# List running containers
docker compose ps
```

---

## Troubleshooting

### `MYSQL_ROOT_PASSWORD` / `JWT_SECRET` variable is not set

**Cause:** `.env` does not exist yet. Compose reads variables from a root `.env` file automatically.

**Fix:**

```bash
cp .env.example .env
# Edit .env and set MYSQL_ROOT_PASSWORD and JWT_SECRET
```

### `error getting credentials - err: exit status 1`

**Cause:** Local Docker credential helper misconfiguration (Docker Desktop, WSL, or `~/.docker/config.json`). This is not an application issue.

**Fix (try in order):**

1. Restart Docker Desktop / Docker Engine.
2. On WSL, ensure Docker Desktop WSL integration is enabled.
3. Remove a broken credential helper from `~/.docker/config.json` (e.g. `"credsStore": "desktop"`).
4. Test a public pull: `docker pull galinkivamshi/paylater-customer-service:latest` — **no Docker Hub login is required** for these images.

### `container name "/paylater-mysql" is already in use`

**Cause:** A previous PayLater run left containers behind (failed run, different clone directory, or `docker compose down` was not run).

**Fix:**

```bash
docker compose down
# If containers remain:
docker rm -f paylater-mysql paylater-identity paylater-customer paylater-merchant \
  paylater-transaction paylater-payback paylater-reporting paylater-gateway
docker compose up -d
```

`container_name:` is intentional for predictable naming; remove stale containers rather than changing the Compose file.

### Services show `unhealthy` / gateway does not start

**Cause:** Usually a **stale locally cached** `:latest` image (built before `/health` endpoints were added). Docker Compose does not re-pull `:latest` by default if an older copy exists on disk. This often affects merchant, transaction, payback, and reporting while customer/identity appear healthy.

**Healthcheck failure looks like:**

```text
wget: server returned error: HTTP/1.1 404 Not Found
```

**Fix:**

```bash
docker compose down
docker compose pull
docker compose up -d
```

Or simply `docker compose up -d` — the Compose file sets `pull_policy: always` so images are refreshed on every start.

Inspect a failing service:

```bash
docker inspect paylater-identity --format '{{json .State.Health}}'
docker compose logs identity-service --tail=50
curl http://localhost:8081/health
```

Expected: `{"status":"ok"}` with HTTP 200.

### `network paylater-network was found but was not created by compose`

**Cause:** A stale `paylater-network` exists from a manual `docker network create` or an old project.

**Fix:**

```bash
docker compose down
docker network rm paylater-network
docker compose up -d
```

Compose will recreate the network with the correct labels automatically.

---

## Screenshots

Screenshot placeholders were removed from this README. Add images under `docs/screenshots/` when available:

- `docs/screenshots/architecture-diagram.png`
- `docs/screenshots/postman-api-testing.png`
- `docs/screenshots/docker-containers.png`
- `docs/screenshots/docker-images.png`

---

## Known Limitations

- Transaction creation validates `customer_id` and `merchant_id` via same-MySQL cross-database reads; this assumes all databases run on one MySQL server (Docker Compose default).
- Credit-limit enforcement and payback balance validation are enforced in Transaction and Payback services (Steps 36–37).
- `report_db` is refreshed on startup and every 60 seconds; there is a small window for concurrent writes during snapshot copy.
- No list GET endpoints for transactions or paybacks.
- Merchant update (`PUT /merchants/:id`) returns 404 when the merchant does not exist.

---

## Future Improvements

- Add gateway/service health checks in Kubernetes manifests
- Event-driven snapshot refresh for high-traffic reporting
- Return created entity IDs in POST responses
- Add list/query endpoints for transactions and paybacks
- Add OpenAPI/Swagger documentation

---

## License

This project does not include a `LICENSE` file yet. Add a license before public distribution.

---

## Additional Documentation

- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — Developer workflow, SQLC, Docker, local setup
- [`docs/openapi.yaml`](docs/openapi.yaml) — OpenAPI 3.0 API contract (gateway)
- [`shared/README.md`](shared/README.md) — Shared module details
- Per-service `README.md` and `docs/` folders — Service-specific notes

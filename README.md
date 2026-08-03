# PayLater Backend API

PayLater is a **Go microservices** backend for customer credit, merchant onboarding, PayLater purchases, repayments, and admin reporting.

Clients talk to a single **API gateway** on `:8080`. The gateway reverse-proxies each route group to the owning service. Cross-cutting concerns (config, MySQL helpers, JWT, auth middleware, JSON responses) live in the shared module `paylater/shared`.

---

## Architecture overview

```text
Client / Postman
       |
       v
API Gateway (monolith main.go)  :8080
       |
       +-- /auth/*              → Identity Service     :8081  (identity_db)
       +-- /customers*          → Customer Service     :8082  (customer_db)
       +-- /merchants*          → Merchant Service     :8083  (merchant_db)
       +-- /transactions*       → Transaction Service  :8084  (transaction_db)
       +-- /paybacks*           → Payback Service      :8085  (payback_db)
       +-- /reports/*           → Reporting Service    :8086  (report_db snapshot)
```

Each service follows the same layered layout:

```text
HTTP (Gin router + shared middleware)
  → handler (validate + map HTTP)
  → service (business rules)
  → repository (SQLC)
  → MySQL (service-owned database)
```

Services do not call each other over HTTP today. Cross-entity IDs are stored as plain values after the database split (no cross-DB foreign keys). Reporting reads a **snapshot** copy in `report_db` (not live CDC).

---

## Folder structure

```text
paylater/
├── main.go                 # API gateway entry (proxies only)
├── config/gateway.go       # Upstream service URL resolution
├── routes/*_proxy.go       # Strangler reverse-proxy route groups
├── shared/                 # Shared platform module (paylater/shared)
│   ├── config/ database/ jwt/ middleware/
│   ├── response/ validator/ utils/ constants/ errors/ logger/
│   └── README.md
├── identity-service/       # Auth register/login
├── customer-service/       # Customer CRUD (admin)
├── merchant-service/       # Merchant onboard + commission
├── transaction-service/    # PayLater purchases
├── payback-service/        # Customer repayments
├── reporting-service/      # Admin aggregate reports
├── db/                     # Legacy monolith SQLC (unused by gateway)
├── middleware/ token/      # Legacy monolith auth (unused by gateway)
└── README.md
```

### Typical service layout

```text
<service>/
├── cmd/server/main.go      # Process entry; wires layers and listens
├── internal/
│   ├── handler/            # HTTP adapters
│   ├── service/            # Domain logic
│   ├── repository/         # SQLC wrappers
│   └── router/             # Route groups + authz
├── db/
│   ├── schema/             # Owned MySQL schema
│   ├── queries/            # Hand-written SQL for SQLC
│   └── sqlc/               # Generated code — do not edit
├── .env                    # Service DB + JWT_SECRET
└── README.md
```

---

## Service responsibilities and ports

| Service | Port | Database | Responsibility |
|---------|------|----------|----------------|
| API Gateway | 8080 | none | Strangler reverse proxy; single client entry |
| Identity | 8081 | `identity_db` | Register/login, bcrypt passwords, issue JWT |
| Customer | 8082 | `customer_db` | Create/list customers (admin) |
| Merchant | 8083 | `merchant_db` | Create merchants; update commission |
| Transaction | 8084 | `transaction_db` | Record PayLater purchases |
| Payback | 8085 | `payback_db` | Record customer repayments |
| Reporting | 8086 | `report_db` | Admin reports from read-model snapshot |

Shared module: `shared/` (`replace paylater/shared => ../shared` in each service `go.mod`).

---

## Shared platform

Documented in detail in [`shared/README.md`](shared/README.md).

| Package | Role |
|---------|------|
| `config` | Load port, DB, `JWT_SECRET` from env |
| `database` | MySQL connect with `parseTime=true` |
| `jwt` | HS256 generate/validate (24h) |
| `middleware` | Bearer auth + `AuthorizeRoles` |
| `response` | Stable `{"error"}` / `{"message"}` JSON |
| `validator` | YYYY-MM-DD date parsing |
| `utils` | DECIMAL/`[]byte` → string (Reporting) |
| `constants` / `errors` / `logger` | Shared literals, sentinels, thin logging |

`JWT_SECRET` must be identical on Identity and every service that validates tokens.

---

## API Gateway role

- Listens on **`:8080`**.
- Registers only reverse-proxy routes (`routes/*_proxy.go`).
- Does **not** validate JWT, open MySQL, or run domain handlers.
- Upstream URLs from env (`IDENTITY_SERVICE_URL`, `CUSTOMER_SERVICE_URL`, …) via `config/gateway.go`.

AuthN/AuthZ run inside each microservice using `paylater/shared/middleware`.

---

## API endpoints (12)

### Authentication (public → Identity)

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |

### Customer (→ Customer)

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/customers` | Admin |
| GET | `/customers` | Admin |

### Merchant (→ Merchant)

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/merchants` | Admin, Merchant |
| PUT | `/merchants/:id` | Admin |

### Transaction (→ Transaction)

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/transactions` | Admin, Customer |

### Payback (→ Payback)

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/paybacks` | Admin, Customer |

### Reports (→ Reporting)

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/reports/merchant-fees` | Admin |
| GET | `/reports/customer-dues` | Admin |
| GET | `/reports/credit-limit` | Admin |
| GET | `/reports/total-dues` | Admin |

Protected calls need:

```text
Authorization: Bearer <JWT>
```

---

## Authentication and authorization

- Passwords hashed with **bcrypt** (Identity Service).
- JWT signed with **HS256**, 24h expiry, secret from `JWT_SECRET`.
- Claims: `user_id`, `email`, `role`.
- Roles: `admin`, `customer`, `merchant`.
- Middleware flow on each service: AuthMiddleware → AuthorizeRoles → handler.

---

## Environment variables

### Gateway (repo root `.env`)

```text
JWT_SECRET=<strong-random-secret>

IDENTITY_SERVICE_URL=http://localhost:8081
CUSTOMER_SERVICE_URL=http://localhost:8082
MERCHANT_SERVICE_URL=http://localhost:8083
TRANSACTION_SERVICE_URL=http://localhost:8084
PAYBACK_SERVICE_URL=http://localhost:8085
REPORTING_SERVICE_URL=http://localhost:8086
```

### Each microservice (`<service>/.env`)

```text
DB_HOST=localhost
DB_PORT=3306
DB_USER=<user>
DB_PASSWORD=<password>
DB_NAME=<service_db_name>
JWT_SECRET=<same-as-identity>
PORT=<optional; defaults in code>
```

Use Unix LF line endings in `.env` files. Do not commit secrets.

---

## Build and run

Requires Go **1.25+**, MySQL with the six service databases created and schemas applied.

### Build shared + all services

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

### Run (separate terminals; start services before the gateway)

```bash
cd identity-service && go run ./cmd/server
cd customer-service && go run ./cmd/server
cd merchant-service && go run ./cmd/server
cd transaction-service && go run ./cmd/server
cd payback-service && go run ./cmd/server
cd reporting-service && go run ./cmd/server

# From repo root (loads gateway .env)
go run .
```

Gateway: `http://localhost:8080`

### SQLC

Hand-written SQL lives in each service under `db/queries/`. Generated code is under `db/sqlc/` — **do not edit generated files**. Regenerate with `sqlc generate` inside the service after query changes.

---

## Important limitations

- After DB split, invalid foreign IDs may succeed at insert time (no cross-DB FKs).
- `report_db` is a **stale snapshot**; reports are not guaranteed live.
- No list GET for transactions/paybacks; merchants have POST + PUT only.

---

## Testing

1. `POST /auth/login` via the gateway.
2. Copy the JWT.
3. Call protected endpoints with `Authorization: Bearer <token>`.

---

## Security checklist

- bcrypt password hashes
- HS256 JWT with shared secret
- Role-based authorization on protected routes
- Secrets only in environment / `.env` (gitignored)
- Gateway does not weaken service-level auth (proxies pass Authorization through)

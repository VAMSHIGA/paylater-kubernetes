# PayLater Customer Service

Independent microservice for customer management (`customers` table).

## Status

**Scaffold only (Phase 1).** No endpoints, business logic, or database schema are active yet.

## Planned APIs (unchanged from monolith)

| Method | Route | Access |
|--------|-------|--------|
| POST | `/customers` | Admin (JWT required) |
| GET | `/customers` | Admin (JWT required) |

## Project layout

```text
customer-service/
├── cmd/server/          Entry point
├── internal/
│   ├── config/          Environment configuration
│   ├── database/        MySQL connection
│   ├── handler/         HTTP handlers
│   ├── service/         Business logic
│   ├── repository/      Data access (SQLC)
│   ├── router/          Route registration
│   └── middleware/      JWT auth + admin authorization
├── db/
│   ├── schema/          customers table DDL (Phase 2)
│   ├── queries/         SQLC queries (Phase 2)
│   └── sqlc/            Generated code (Phase 2)
└── docs/                Architecture notes
```

## Local setup (scaffold)

```bash
cd customer-service
cp .env.example .env
go run ./cmd/server
```

Expected output: scaffold log message only.

## Configuration

See `.env.example` for required variables.

**Database:** Customer Service will use its own MySQL database (`customer_db` by default), separate from the PayLater monolith database.

## Next phase

Phase 2 will migrate customer code from the monolith without changing API contracts or business behavior.

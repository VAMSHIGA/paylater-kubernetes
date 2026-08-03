# PayLater Transaction Service

Independent microservice for PayLater purchase transactions (`transactions` table).

## Status

**Scaffold only (Phase 2).** No endpoints, business logic, or database schema are active yet.

## Planned APIs (unchanged from monolith)

| Method | Route | Access |
|--------|-------|--------|
| POST | `/transactions` | Admin or customer (JWT required) |

## Project layout

```text
transaction-service/
├── cmd/server/          Entry point
├── internal/
│   ├── config/          Environment configuration
│   ├── database/        MySQL connection
│   ├── handler/         HTTP handlers
│   ├── service/         Business logic
│   ├── repository/      Data access (SQLC)
│   ├── router/          Route registration
│   ├── middleware/      JWT auth + role authorization
│   └── token/           JWT validation
├── db/
│   ├── schema/          transactions table DDL (Phase 3)
│   ├── queries/         SQLC queries (Phase 3)
│   └── sqlc/            Generated code (Phase 3)
└── docs/                Architecture notes
```

## Local setup (scaffold)

```bash
cd transaction-service
cp .env.example .env
go run ./cmd/server
```

Expected output: scaffold log message only.

## Configuration

See `.env.example` for required variables.

**Database:** Transaction Service will use its own MySQL database (`transaction_db` by default), separate from the PayLater monolith database.

## Next phase

Phase 3 will migrate transaction code from the monolith without changing API contracts or business behavior.

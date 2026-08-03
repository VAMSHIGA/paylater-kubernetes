# PayLater Merchant Service

Independent microservice for merchant management (`merchants` table).

## Status

**Scaffold only (Phase 2).** No endpoints, business logic, or database schema are active yet.

## Planned APIs (unchanged from monolith)

| Method | Route | Access |
|--------|-------|--------|
| POST | `/merchants` | Admin or merchant (JWT required) |
| PUT | `/merchants/:id` | Admin (JWT required) |

## Project layout

```text
merchant-service/
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
│   ├── schema/          merchants table DDL (Phase 3)
│   ├── queries/         SQLC queries (Phase 3)
│   └── sqlc/            Generated code (Phase 3)
└── docs/                Architecture notes
```

## Local setup (scaffold)

```bash
cd merchant-service
cp .env.example .env
go run ./cmd/server
```

Expected output: scaffold log message only.

## Configuration

See `.env.example` for required variables.

**Database:** Merchant Service will use its own MySQL database (`merchant_db` by default), separate from the PayLater monolith database.

## Next phase

Phase 3 will migrate merchant code from the monolith without changing API contracts or business behavior.

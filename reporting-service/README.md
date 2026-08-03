# PayLater Reporting Service

Independent microservice for PayLater reports (aggregations across customers, merchants, transactions, and paybacks).

## Status

**Phase 3 complete.** All four report GET endpoints run on Reporting Service (`:8086` by default).

Monolith report routes remain until strangler routing and cleanup phases.

**Database:** Reporting Service reads from `report_db` (read-model snapshot). See `docs/DATABASE_OWNERSHIP.md`.

## Planned APIs (unchanged from monolith)

| Method | Route | Access |
|--------|-------|--------|
| GET | `/reports/merchant-fees` | Admin (JWT required) |
| GET | `/reports/customer-dues` | Admin (JWT required) |
| GET | `/reports/credit-limit` | Admin (JWT required) |
| GET | `/reports/total-dues` | Admin (JWT required) |

## Project layout

```text
reporting-service/
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
│   ├── schema/          Read-model DDL (Phase 3/4)
│   ├── queries/         SQLC queries (Phase 3)
│   └── sqlc/            Generated code (Phase 3)
└── docs/                Architecture notes
```

## Local setup (scaffold)

```bash
cd reporting-service
cp .env.example .env
go run ./cmd/server
```

Expected output: scaffold log message only.

## Configuration

See `.env.example` for required variables.

**Database:** Reporting Service will use its own MySQL database (`report_db` by default), separate from the PayLater monolith database.

## Next phase

Phase 3 will migrate report code from the monolith without changing API contracts or business behavior.

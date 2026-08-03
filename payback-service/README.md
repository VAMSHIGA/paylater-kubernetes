# PayLater Payback Service

Independent microservice for customer payback records (`paybacks` table).

## Status

**Phase 3 complete.** `POST /paybacks` runs on Payback Service (`:8085` by default).

Monolith payback route wiring removed; strangler proxy not yet configured.

## Planned APIs (unchanged from monolith)

| Method | Route | Access |
|--------|-------|--------|
| POST | `/paybacks` | Admin or customer (JWT required) |

## Project layout

```text
payback-service/
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
│   ├── schema/          paybacks table DDL (Phase 3)
│   ├── queries/         SQLC queries (Phase 3)
│   └── sqlc/            Generated code (Phase 3)
└── docs/                Architecture notes
```

## Local setup (scaffold)

```bash
cd payback-service
cp .env.example .env
go run ./cmd/server
```

Expected output: scaffold log message only.

## Configuration

See `.env.example` for required variables.

**Database:** Payback Service will use its own MySQL database (`payback_db` by default), separate from the PayLater monolith database.

## Next phase

Phase 3 will migrate payback code from the monolith without changing API contracts or business behavior.

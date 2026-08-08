# PayLater Customer Service

Independent microservice for customer management (`customers` table).

## Status

**Phase 2 complete.** Customer endpoints are implemented on this service (`HTTP_PORT`, default `8082`).

## APIs

| Method | Route | Access |
|--------|-------|--------|
| POST | `/customers` | Admin (JWT required) |
| GET | `/customers` | Admin (JWT required) |
| GET | `/health` | Public |

## Project layout

```text
customer-service/
├── cmd/server/          Entry point
├── internal/
│   ├── handler/         HTTP handlers
│   ├── service/         Business logic
│   ├── repository/      Data access (SQLC)
│   └── router/          Route registration
├── db/
│   ├── queries/         SQLC input queries
│   ├── schema/          Database schema
│   └── sqlc/            Generated Go code
└── docs/migrations/     Database bootstrap SQL
```

## Local development

```bash
cp .env.example .env
go run ./cmd/server
```

Service listens on `:8082` by default.

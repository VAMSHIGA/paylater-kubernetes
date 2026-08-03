# PayLater Identity Service

Independent microservice for authentication and user identity (`users` table).

## Status

**Phase 2 complete.** Authentication endpoints run on this service (`HTTP_PORT`, default `8081`).

Monolith auth routes have been removed; use this service for `POST /auth/register` and `POST /auth/login`.

## Planned APIs (unchanged from monolith)

| Method | Route | Access |
|--------|-------|--------|
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |

## Project layout

```text
identity-service/
├── cmd/server/          Entry point
├── internal/
│   ├── config/          Environment configuration
│   ├── handler/         HTTP handlers
│   ├── service/         Business logic
│   ├── repository/      Data access (SQLC)
│   ├── router/          Route registration
│   └── token/           JWT generation (sign only)
├── db/
│   ├── schema/          users table DDL (Phase 2)
│   ├── queries/         SQLC queries (Phase 2)
│   └── sqlc/            Generated code (Phase 2)
└── docs/                Architecture notes
```

## Local setup (scaffold)

```bash
cd identity-service
cp .env.example .env
go run ./cmd/server
```

Expected output: scaffold log message only.

## Configuration

See `.env.example` for required variables.

**Database:** Identity Service uses its own MySQL database (`identity_db` by default), separate from the PayLater monolith database.

Migration scripts: `docs/migrations/`

## Next phase

Phase 2 will migrate authentication code from the monolith without changing API contracts or business behavior.

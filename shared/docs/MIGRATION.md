# Shared Platform — Service Migration Plan

This document describes how each microservice will adopt `paylater/shared` in a future phase.

**Current phase:** shared library created only. No service code was modified.

---

## Duplicated code identified

| Component | Duplicated in | Notes |
|-----------|---------------|-------|
| `config.Load()` + structs | All 6 services | Only default `HTTP_PORT` differs |
| `database.Connect()` | All 6 services | Identical DSN + `parseTime=true` |
| `Claims` struct | Identity + 5 validators | Same JSON fields |
| `ValidateToken()` | Customer, Merchant, Transaction, Payback, Reporting | Identity lacks ValidateToken today (only GenerateToken) |
| `GenerateToken()` | Identity (+ monolith `token/jwt.go`) | 24h HS256 |
| `AuthMiddleware()` | 5 services (+ monolith middleware) | Identical behavior |
| `AuthorizeRoles()` | 5 services (+ monolith middleware) | Identical behavior |
| `gin.H{"error": ...}` responses | All handlers | Same JSON shape |
| `gin.H{"message": ...}` success | Create handlers | Same JSON shape |
| `time.Parse("2006-01-02", ...)` | Transaction, Payback, Merchant handlers | Same layout |
| `valueToString()` | Reporting handler | MySQL []byte → string |

---

## Per-service migration steps

### Identity Service (`:8081`)

| Replace | With |
|---------|------|
| `internal/config` | `shared/config` — `Load("8081")` |
| `internal/database` | `shared/database` |
| `internal/token` (GenerateToken) | `shared/jwt` |
| — | Add `ValidateToken` from shared if needed later |

**Keep local:** auth handlers, services, repository, SQLC.

### Customer Service (`:8082`)

| Replace | With |
|---------|------|
| `internal/config` | `shared/config` — `Load("8082")` |
| `internal/database` | `shared/database` |
| `internal/token` | `shared/jwt` |
| `internal/middleware` | `shared/middleware` |

**Handlers:** optional `shared/response` for error/success JSON (same shapes).

### Merchant Service (`:8083`)

Same as Customer; `Load("8083")`.

**Handlers:** optional `shared/validator.ParseDateYYYYMMDD` for onboarding date (keep field-specific error messages in handler).

### Transaction Service (`:8084`)

Same as Customer; `Load("8084")`.

**Handlers:** optional validator for `transaction_date`.

### Payback Service (`:8085`)

Same as Customer; `Load("8085")`.

**Handlers:** optional validator for `payment_date`.

### Reporting Service (`:8086`)

Same as Customer; `Load("8086")`.

**Handlers:** replace local `valueToString` with `shared/utils.ValueToString`.

---

## Monolith (API gateway)

| Component | Action |
|-----------|--------|
| `middleware/auth.go`, `authorization.go` | Replace with `shared/middleware` when monolith needs JWT again |
| `token/jwt.go` | Replace with `shared/jwt` for token generation in tests |
| `db/db.go` | Not used by gateway today; no change |

---

## Migration order (recommended)

1. **Customer Service** — simplest JWT + middleware consumer
2. **Merchant, Transaction, Payback, Reporting** — same pattern
3. **Identity Service** — adopt shared `GenerateToken`; keep auth handlers local
4. **Monolith** — only if JWT middleware is reintroduced

---

## Verification checklist (per service)

After each adoption:

- [ ] `go build` succeeds
- [ ] All API contracts unchanged (URLs, methods, JSON, status codes)
- [ ] JWT auth and role checks behave identically
- [ ] MySQL connection uses `parseTime=true`
- [ ] Remove dead local `config`, `database`, `token`, `middleware` packages

---

## Out of scope for shared library

- Business handlers, services, repositories
- SQLC queries and domain models
- Service-specific routes
- Strangler proxy (`config/gateway.go` on monolith)
- `report_db` / domain database schemas

# PayLater Shared Platform

Reusable Go module (`paylater/shared`) used by every PayLater microservice for
cross-cutting infrastructure: configuration, MySQL connectivity, JWT, auth
middleware, JSON responses, validation helpers, and constants.

## Why it exists

Before extraction, each service copied the same config/database/JWT/middleware
code. The shared module is the single source of truth so auth and env behavior
stay identical across Identity, Customer, Merchant, Transaction, Payback, and
Reporting.

## Packages

| Package | Responsibility | Used by |
|---------|----------------|---------|
| `config` | Load HTTP/DB/JWT settings from env | All six services |
| `database` | Open MySQL with `parseTime=true` | All six services |
| `jwt` | HS256 generate/validate tokens (24h) | Identity (generate); others via middleware |
| `middleware` | Bearer JWT auth + role checks | Customer, Merchant, Transaction, Payback, Reporting |
| `response` | Stable `{"error"}` / `{"message"}` JSON | All services with HTTP handlers |
| `validator` | YYYY-MM-DD date parsing | Merchant, Transaction, Payback |
| `utils` | MySQL decimal/`[]byte` → string | Reporting |
| `logger` | Thin Info/Error logging | `shared/database` |
| `constants` | Roles, headers, context keys, env names | Middleware & routers |
| `errors` | Sentinel errors matching API text | Config, JWT, middleware |

## Local development

Each service `go.mod` uses:

```go
require paylater/shared v0.0.0
replace paylater/shared => ../shared
```

## Usage example

```go
cfg, err := config.Load("8082")
conn, err := database.Connect(cfg.DB)
router.GET("/customers",
    middleware.AuthMiddleware(),
    middleware.AuthorizeRoles(constants.RoleAdmin),
    handler.ListCustomers,
)
```

See `docs/MIGRATION.md` for historical adoption notes.

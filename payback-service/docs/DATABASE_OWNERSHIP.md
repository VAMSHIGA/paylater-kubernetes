# Payback Service — Database Ownership (Phase 4)

## Foreign key limitation

Before database separation, `POST /paybacks` inserted into `paylater_tables.paybacks`
with a MySQL foreign key:

- `customer_id` → `paylater_tables.customers(id)`

Invalid `customer_id` values failed at the database layer and returned
**HTTP 500** with a MySQL foreign key error.

After `payback_db` ownership, `customer_id` is stored as a logical reference only.
**No database foreign keys** are defined in `payback_db` because `customers` lives
in `customer_db` (Customer Service).

### Behavior change (documented, no API contract change)

| Scenario | Monolith DB (before) | `payback_db` (after) |
|----------|----------------------|----------------------|
| Valid `customer_id` | 201 success | 201 success |
| Invalid `customer_id` | 500 FK error | **201 success** (row stored with orphan ID) |
| Request/response JSON | Unchanged | Unchanged |
| Status codes for valid requests | 201 | 201 |

No new validation or service-to-service calls were added in this phase per migration rules.

### Mitigation (future phases, out of scope here)

- Customer existence checks via HTTP calls to Customer Service
- Shared reference registry
- Event-driven replication into monolith for reports

Reports in the monolith still read `paylater_tables.paybacks` (stale copy until sync or Report extraction).

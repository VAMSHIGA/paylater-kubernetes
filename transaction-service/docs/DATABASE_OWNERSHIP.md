# Transaction Service — Database Ownership (Phase 4)

## Foreign key limitation

Before database separation, `POST /transactions` inserted into `paylater_tables.transactions`
with MySQL foreign keys:

- `customer_id` → `paylater_tables.customers(id)`
- `merchant_id` → `paylater_tables.merchants(id)`

Invalid `customer_id` or `merchant_id` values failed at the database layer and returned
**HTTP 500** with a MySQL foreign key error.

After `transaction_db` ownership, `customer_id` and `merchant_id` are stored as logical
references only. **No database foreign keys** are defined in `transaction_db` because
`customers` and `merchants` live in `customer_db` and `merchant_db`.

### Behavior change (documented, no API contract change)

| Scenario | Monolith DB (before) | `transaction_db` (after) |
|----------|----------------------|---------------------------|
| Valid IDs | 201 success | 201 success |
| Invalid `customer_id` / `merchant_id` | 500 FK error | **201 success** (row stored with orphan IDs) |
| Request/response JSON | Unchanged | Unchanged |
| Status codes for valid requests | 201 | 201 |

No new validation or service-to-service calls were added in this phase per migration rules.

### Mitigation (future phases, out of scope here)

- Customer/Merchant existence checks via HTTP calls
- Shared reference registry
- Event-driven replication

Reports and Paybacks in the monolith still read `paylater_tables.transactions` (stale copy).

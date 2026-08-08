# Reporting Service — Database Ownership

## Read-model snapshot

`report_db` is a **read-only snapshot** of the four tables required by `report.sql`:

- `customers`
- `merchants`
- `transactions`
- `paybacks`

Reporting Service reads **only** from `report_db` for report queries.

## Snapshot refresh

The Reporting Service refreshes `report_db` from domain databases using `internal/sync/snapshot.go`:

| When | Behavior |
|------|----------|
| Service startup | Full TRUNCATE + COPY from `customer_db`, `merchant_db`, `transaction_db`, `payback_db` |
| Every 60 seconds | Background scheduled refresh (same copy logic) |
| Report requests | Read from `report_db` only (no per-request refresh) |

All domain databases must live on the same MySQL server as `report_db` (as in Docker Compose).

## Domain ownership

| Domain | Live database | Reporting snapshot |
|--------|---------------|-------------------|
| Customers | `customer_db` | `report_db.customers` |
| Merchants | `merchant_db` | `report_db.merchants` |
| Transactions | `transaction_db` | `report_db.transactions` |
| Paybacks | `payback_db` | `report_db.paybacks` |

## Future improvements

- Event-driven or on-demand admin refresh endpoint
- CDC / message-bus replication when services run on separate MySQL instances

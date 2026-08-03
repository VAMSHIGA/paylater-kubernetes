# Reporting Service — Database Ownership (Phase 4)

## Read-model snapshot

`report_db` is a **read-only snapshot** of the four tables required by `report.sql`:

- `customers`
- `merchants`
- `transactions`
- `paybacks`

Reporting Service reads **only** from `report_db`. It does not write to these tables.

Data is copied from `paylater_tables` at migration time. **No automatic synchronization** is implemented in this phase.

## Staleness limitation

Live writes are owned by domain microservices:

| Domain | Live database | Reporting snapshot |
|--------|---------------|-------------------|
| Customers | `customer_db` | `report_db.customers` (snapshot) |
| Merchants | `merchant_db` | `report_db.merchants` (snapshot) |
| Transactions | `transaction_db` | `report_db.transactions` (snapshot) |
| Paybacks | `payback_db` | `report_db.paybacks` (snapshot) |

New records created via Customer, Merchant, Transaction, or Payback services **do not** appear in reports until `report_db` is refreshed.

The monolith `paylater_tables` copies are also stale relative to live service databases.

### Behavior (documented, no API contract change)

| Scenario | Report output |
|----------|----------------|
| Data at migration time | Matches prior `paylater_tables` reports |
| New customer/merchant/transaction/payback after migration | **Not reflected** until snapshot refresh |
| Request/response JSON | Unchanged |
| SQL formulas | Unchanged |

No Kafka, RabbitMQ, CDC, event sourcing, or sync jobs were added per migration rules.

## Mitigation (future phases, out of scope here)

- Scheduled snapshot refresh from service databases or monolith
- CDC / event-driven replication into `report_db`
- Federated queries across service databases

## Monolith

`paylater_tables` report copies remain until strangler cleanup. Reports on the monolith still read `paylater_tables` until proxy migration.

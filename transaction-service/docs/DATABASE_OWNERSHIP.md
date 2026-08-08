# Transaction Service — Database Ownership

## Foreign key limitation

Before database separation, `POST /transactions` inserted into `paylater_tables.transactions`
with MySQL foreign keys:

- `customer_id` → `paylater_tables.customers(id)`
- `merchant_id` → `paylater_tables.merchants(id)`

After `transaction_db` ownership, `customer_id` and `merchant_id` are stored as logical
references only. **No database foreign keys** are defined in `transaction_db` because
`customers` and `merchants` live in `customer_db` and `merchant_db`.

## Current validation

The Transaction Service validates IDs before insert using read-only cross-database queries
on the same MySQL server (Docker Compose default):

| Scenario | HTTP status |
|----------|-------------|
| Valid `customer_id` and `merchant_id` | 201 |
| Invalid `customer_id` | 404 `customer not found` |
| Invalid `merchant_id` | 404 `merchant not found` |

This does not use HTTP calls between services and does not add cross-database foreign keys.

## Future improvements

- HTTP existence checks if services move to separate MySQL instances
- Event-driven reference registry

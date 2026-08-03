# Identity Database Migrations

## Strategy

1. Create `identity_db` and `users` table (`001_create_identity_database.sql`).
2. Copy rows from monolith `paylater_tables.users` (`002_migrate_users_from_monolith.sql`).
3. Point Identity Service `DB_NAME=identity_db`.
4. Verify register/login via monolith proxy (`:8080/auth/*`).
5. Optionally drop `paylater_tables.users` (`003_drop_monolith_users_table.sql`).

## Run locally

```bash
mysql -u root -p < docs/migrations/001_create_identity_database.sql
mysql -u root -p < docs/migrations/002_migrate_users_from_monolith.sql
```

Preserve user `id` values so existing JWT `user_id` claims remain consistent.

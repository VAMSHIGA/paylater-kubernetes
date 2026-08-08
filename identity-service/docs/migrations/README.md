# Identity Database Migrations

## Strategy

1. Create `identity_db` and `users` table (`001_create_identity_database.sql`).
2. Point Identity Service `DB_NAME=identity_db`.
3. Verify register/login via API Gateway (`:8080/auth/*`).

## Run locally

```bash
mysql -u root -p < docs/migrations/001_create_identity_database.sql
```

In Docker Compose, the init script is mounted automatically on first MySQL startup.

Captures schema changes that were applied to the original Neon database with
`prisma db push` and never recorded as a migration: OAuth accounts, favourites,
featured stores, per-store categories, product image/category/suggested fields,
the ADMIN role, and nullable password_hash for OAuth-only users.

Generated with `prisma migrate diff --from-config-datasource --to-schema` against
a database that had every prior migration applied, so it is exactly the delta.

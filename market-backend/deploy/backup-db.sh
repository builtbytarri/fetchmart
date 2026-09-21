#!/usr/bin/env bash
# Nightly logical backup of the FetchMart Postgres container.
#
# Runs pg_dump inside the db container (so no client tools are needed on the
# host), gzips the output, and keeps the last 14 days. Install as the `deploy`
# user's cron job:
#
#   0 3 * * * /opt/fetchmart/market-backend/deploy/backup-db.sh >> /opt/fetchmart/backups/backup.log 2>&1
#
# Restore with:
#   gunzip -c backups/fetchmart-YYYY-MM-DD.sql.gz | docker exec -i fetchmart-db psql -U fetchmart -d fetchmart
#
# These dumps live on the same box as the database. Copy them somewhere else
# too — a dead disk takes both.

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/fetchmart/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
CONTAINER="fetchmart-db"
STAMP="$(date +%F)"
OUT="$BACKUP_DIR/fetchmart-$STAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

docker exec "$CONTAINER" pg_dump -U fetchmart -d fetchmart --no-owner --no-acl \
  | gzip -9 > "$OUT.tmp"
mv "$OUT.tmp" "$OUT"

find "$BACKUP_DIR" -name 'fetchmart-*.sql.gz' -mtime "+$KEEP_DAYS" -delete

echo "$(date -Is) ok $(du -h "$OUT" | cut -f1) $OUT"

#!/usr/bin/env bash
# Usage: ./scripts/backup-postgres.sh
# Reads DB credentials from environment variables and dumps to ./backups/
# Required env vars: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD

set -euo pipefail

BACKUP_DIR="$(dirname "$0")/../backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/orrico_${TIMESTAMP}.dump"

if [[ -z "${PGHOST:-}" || -z "${PGDATABASE:-}" || -z "${PGUSER:-}" || -z "${PGPASSWORD:-}" ]]; then
  echo "Error: PGHOST, PGDATABASE, PGUSER, and PGPASSWORD must be set." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

export PGPASSWORD

pg_dump \
  --host="${PGHOST}" \
  --port="${PGPORT:-5432}" \
  --username="${PGUSER}" \
  --dbname="${PGDATABASE}" \
  --format=custom \
  --no-acl \
  --no-owner \
  --file="${BACKUP_FILE}"

echo "Backup written to ${BACKUP_FILE}"

# Prune backups older than 30 days
find "$BACKUP_DIR" -name "orrico_*.dump" -mtime +30 -delete
echo "Pruned backups older than 30 days."

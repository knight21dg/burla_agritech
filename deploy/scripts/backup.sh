#!/usr/bin/env bash
#
# The nightly backup: the database, and the photographs.
#
#   0 2 * * *  /srv/burla/deploy/scripts/backup.sh >> /var/log/burla-backup.log 2>&1
#
# Two things are worth saying plainly. The database dump is the business —
# products, prices, orders, enquiries, customers. The photo folder is the
# other half: it is NOT in the database, and a database restored without it
# is a catalogue of broken images.
#
# And: a backup nobody has restored is not a backup. docs/DATABASE-RECOVERY.md
# §6 is the drill; do it once before launch and once a quarter after.
set -euo pipefail

BACKUP_DIR=/var/backups/burla
MEDIA_DIR=/var/lib/burla/media
KEEP_DAYS=30
STAMP=$(date +%Y-%m-%d_%H%M)

set -a
# shellcheck disable=SC1091
source /etc/burla/web.env
set +a

mkdir -p "$BACKUP_DIR"

echo "[$(date -Is)] dumping the database"
pg_dump --format=custom --no-owner --no-acl \
  --file="$BACKUP_DIR/burla_$STAMP.dump" \
  "${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"

echo "[$(date -Is)] archiving the photographs"
tar --create --gzip --file "$BACKUP_DIR/media_$STAMP.tar.gz" -C "$MEDIA_DIR" .

# Local copies are for a mistake; they are no use at all for a lost server.
# Point this at somewhere off the machine — object storage, another host, or
# the client's own drive — and check it lands before trusting it.
if [ -n "${BACKUP_REMOTE:-}" ]; then
  echo "[$(date -Is)] copying off the machine"
  rsync --archive --quiet "$BACKUP_DIR/burla_$STAMP.dump" "$BACKUP_DIR/media_$STAMP.tar.gz" "$BACKUP_REMOTE"
else
  echo "[$(date -Is)] ! BACKUP_REMOTE is not set — these copies are on the same disk as the thing they protect"
fi

echo "[$(date -Is)] removing local copies older than $KEEP_DAYS days"
find "$BACKUP_DIR" -type f -name 'burla_*.dump' -mtime +"$KEEP_DAYS" -delete
find "$BACKUP_DIR" -type f -name 'media_*.tar.gz' -mtime +"$KEEP_DAYS" -delete

echo "[$(date -Is)] done: $(du -sh "$BACKUP_DIR" | cut -f1) held locally"

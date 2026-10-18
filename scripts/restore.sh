#!/usr/bin/env bash
# Khôi phục từ bản sao lưu (GHI ĐÈ dữ liệu hiện tại!)
#   ./scripts/restore.sh backups/db-20261018-020000.sql.gz backups/media-20261018-020000.tar.gz
set -euo pipefail
cd "$(dirname "$0")/.."
DB_FILE=${1:?Thiếu file db-*.sql.gz}
MEDIA_FILE=${2:-}
COMPOSE="docker compose ${ENV_FILE:+--env-file $ENV_FILE}"

read -r -p "Khôi phục sẽ GHI ĐÈ toàn bộ dữ liệu hiện tại. Gõ 'dong y' để tiếp tục: " ok
[ "$ok" = "dong y" ] || { echo "Đã hủy."; exit 1; }

$COMPOSE stop api web
$COMPOSE exec -T db psql -U ntt -d postgres -c "DROP DATABASE IF EXISTS ntt WITH (FORCE);" -c "CREATE DATABASE ntt OWNER ntt;"
gunzip -c "$DB_FILE" | $COMPOSE exec -T db psql -q -U ntt -d ntt

if [ -n "$MEDIA_FILE" ]; then
  $COMPOSE stop minio
  MINIO=$($COMPOSE ps -aq minio)
  gunzip -c "$MEDIA_FILE" | docker cp - "$MINIO":/
  $COMPOSE start minio
fi

$COMPOSE start api web
echo "Khôi phục xong."

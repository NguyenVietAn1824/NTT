#!/usr/bin/env bash
# Sao lưu database + kho ảnh/video/CV của website NTT.
#   ./scripts/backup.sh                 # lưu vào ./backups, giữ 14 bản gần nhất
#   KEEP=30 ./scripts/backup.sh         # giữ 30 bản
# Chạy tự động mỗi đêm 2h:  crontab -e  →  0 2 * * * cd /home/ubuntu/ntt && ./scripts/backup.sh >> backups/backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."

KEEP=${KEEP:-14}
DIR=${BACKUP_DIR:-./backups}
STAMP=$(date +%Y%m%d-%H%M%S)
COMPOSE="docker compose ${ENV_FILE:+--env-file $ENV_FILE}"
mkdir -p "$DIR"

echo "[$(date '+%F %T')] Bắt đầu sao lưu $STAMP"

# 1) Database PostgreSQL
$COMPOSE exec -T db pg_dump -U ntt -d ntt --no-owner | gzip > "$DIR/db-$STAMP.sql.gz"

# 2) Kho MinIO (ảnh, video, CV)
MINIO=$($COMPOSE ps -q minio)
docker cp "$MINIO":/data - | gzip > "$DIR/media-$STAMP.tar.gz"

# Xóa bản cũ, chỉ giữ $KEEP bản gần nhất
for kind in db media; do
  ls -1t "$DIR"/$kind-*.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f
done

echo "[$(date '+%F %T')] Xong: $(du -h "$DIR/db-$STAMP.sql.gz" | cut -f1) database, $(du -h "$DIR/media-$STAMP.tar.gz" | cut -f1) media"

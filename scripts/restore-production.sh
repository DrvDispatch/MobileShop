#!/bin/bash

# =================================================================
# MOBILESHOP PRODUCTION RESTORE SCRIPT
# This script restores a backup to the production server
# =================================================================

set -e

BACKUP_DIR="${1:-./backups}"
DB_DUMP="$BACKUP_DIR/db_dump.sql"
MINIO_DATA="$BACKUP_DIR/minio_data"

echo "🚀 Starting Production Restore..."
echo "📁 Backup directory: $BACKUP_DIR"

# Check if backup files exist
if [ ! -f "$DB_DUMP" ]; then
    echo "❌ Database dump not found at $DB_DUMP"
    exit 1
fi

if [ ! -d "$MINIO_DATA" ]; then
    echo "⚠️  MinIO data not found at $MINIO_DATA (skipping MinIO restore)"
    SKIP_MINIO=true
fi

# 1. Stop backend to release database connections
echo "🛑 Stopping backend..."
docker compose stop backend || true

# 2. Clean the database dump (remove Prisma's \restrict command if present)
echo "🧹 Cleaning database dump..."
CLEAN_DUMP="/tmp/db_dump_clean.sql"
grep -v '\\restrict' "$DB_DUMP" > "$CLEAN_DUMP" || cp "$DB_DUMP" "$CLEAN_DUMP"

# 3. Drop and recreate database
echo "🗑️  Dropping and recreating database..."
docker exec -i mobileshop-db psql -U mobileshop -d postgres -c "DROP DATABASE IF EXISTS mobileshop;"
docker exec -i mobileshop-db psql -U mobileshop -d postgres -c "CREATE DATABASE mobileshop;"

# 4. Restore database
echo "📥 Restoring database..."
cat "$CLEAN_DUMP" | docker exec -i mobileshop-db psql -U mobileshop -d mobileshop

# 5. Restore MinIO if available
if [ "$SKIP_MINIO" != "true" ]; then
    echo "📥 Restoring MinIO assets..."
    docker compose up -d minio
    sleep 3
    docker cp "$MINIO_DATA/." mobileshop-minio:/data/
    docker compose restart minio
    echo "✅ MinIO assets restored"
fi

# 6. Start backend (will run migrations on startup)
echo "🚀 Starting backend (will apply migrations)..."
docker compose up -d backend

# 7. Wait for backend to be healthy
echo "⏳ Waiting for backend to start..."
sleep 10

# 8. Check backend status
if docker ps | grep -q "mobileshop-backend"; then
    echo "✅ Backend is running"
    docker logs mobileshop-backend --tail 20
else
    echo "❌ Backend failed to start"
    docker logs mobileshop-backend --tail 50
    exit 1
fi

echo ""
echo "====================================================="
echo "✅ RESTORE COMPLETE!"
echo "====================================================="
echo ""
echo "Next steps:"
echo "1. Check the backend logs: docker logs mobileshop-backend -f"
echo "2. Test the API: curl http://127.0.0.1:3001/api/products"
echo ""

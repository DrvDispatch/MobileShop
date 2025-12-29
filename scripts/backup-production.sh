#!/bin/bash

# =================================================================
# MOBILESHOP PRODUCTION BACKUP SCRIPT
# This script creates a bit-perfect copy of your Database and Files
# =================================================================

# Configuration
BACKUP_DIR="./backups/$(date +%Y-%m-%d_%H-%M-%S)"
mkdir -p "$BACKUP_DIR"

echo "🚀 Starting Production Backup..."

# 1. Export PostgreSQL Database
echo "📥 Exporting Database (pg_dump)..."
docker exec mobileshop-db pg_dump -U mobileshop mobileshop > "$BACKUP_DIR/db_dump.sql"
if [ $? -eq 0 ]; then
    echo "✅ Database exported to $BACKUP_DIR/db_dump.sql"
else
    echo "❌ Database export FAILED!"
fi

# 2. Export MinIO (S3) Assets
echo "📥 Exporting MinIO Assets..."
# We go directly into the volume path if local, or use docker cp
docker cp mobileshop-minio:/data "$BACKUP_DIR/minio_data"
if [ $? -eq 0 ]; then
    echo "✅ MinIO assets exported to $BACKUP_DIR/minio_data"
else
    echo "❌ MinIO export FAILED!"
fi

# 3. Compress for Transfer
echo "📦 Compressing backup for transfer..."
tar -czf "mobileshop_migration.tar.gz" -C "$BACKUP_DIR" .
echo "✅ SUCCESS: Your migration package is ready: mobileshop_migration.tar.gz"

echo "---------------------------------------------------"
echo "NEXT STEPS:"
echo "1. Transfer 'mobileshop_migration.tar.gz' to your Hetzner VPS."
echo "2. On the VPS, run 'docker-compose up -d' to start fresh containers."
echo "3. Restore DB: 'cat db_dump.sql | docker exec -i [db_container] psql -U postgres mobileshop'"
echo "4. Restore MinIO: 'docker cp minio_data/. [minio_container]:/data'"
echo "---------------------------------------------------"

@echo off
:: =================================================================
:: MOBILESHOP WINDOWS BACKUP SCRIPT (For Local Docker)
:: =================================================================

set TIMESTAMP=%DATE:~10,4%-%DATE:~4,2%-%DATE:~7,2%_%TIME:~0,2%-%TIME:~3,2%-%TIME:~6,2%
set BACKUP_DIR=.\backups\%TIMESTAMP%
mkdir %BACKUP_DIR%

echo 🚀 Starting Production Backup...

:: 1. Export PostgreSQL Database
echo 📥 Exporting Database (pg_dump)...
docker exec mobileshop-db pg_dump -U mobileshop mobileshop > %BACKUP_DIR%\db_dump.sql
if %ERRORLEVEL% EQU 0 (
    echo ✅ Database exported.
) else (
    echo ❌ Database export FAILED!
)

:: 2. Export MinIO Assets
echo 📥 Exporting MinIO Assets...
docker cp mobileshop-minio:/data %BACKUP_DIR%\minio_data
if %ERRORLEVEL% EQU 0 (
    echo ✅ MinIO assets exported.
) else (
    echo ❌ MinIO export FAILED!
)

echo.
echo ===================================================
echo SUCCESS: Backup created in %BACKUP_DIR%
echo ===================================================
pause

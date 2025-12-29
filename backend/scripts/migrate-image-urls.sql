-- Migration to update image URLs from Cloudflare tunnel to localhost MinIO
-- Run with: psql -h localhost -p 5433 -U mobileshop -d mobileshop -f migrate-image-urls.sql

UPDATE "ProductImage"
SET url = REPLACE(url, 'https://images.smartphoneservice.be', 'http://localhost:9002')
WHERE url LIKE 'https://images.smartphoneservice.be%';

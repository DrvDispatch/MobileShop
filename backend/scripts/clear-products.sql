-- Delete all products from database
-- Run with: npx prisma db execute --file scripts/clear-products.sql

DELETE FROM "Product";

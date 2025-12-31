-- Check brand distribution by tenantId
SELECT "tenantId", COUNT(*) as count FROM "RepairBrand" GROUP BY "tenantId";

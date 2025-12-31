-- Check brand distribution by tenantId
SELECT "tenantId", COUNT(*) as count FROM "RepairBrand" GROUP BY "tenantId";

-- Also delete ALL brands (both global and tenant-specific)
DELETE FROM "RepairDeviceService";
DELETE FROM "RepairDevice";
DELETE FROM "RepairBrand";
DELETE FROM "RepairServiceType";

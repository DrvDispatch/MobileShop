-- Clear all repair data for tenant 3beba920-8e23-4283-a8ea-91a2dfe2baf7
DELETE FROM "RepairDeviceService" WHERE "tenantId" = '3beba920-8e23-4283-a8ea-91a2dfe2baf7';
DELETE FROM "RepairDevice" WHERE "tenantId" = '3beba920-8e23-4283-a8ea-91a2dfe2baf7';
DELETE FROM "RepairBrand" WHERE "tenantId" = '3beba920-8e23-4283-a8ea-91a2dfe2baf7';
DELETE FROM "RepairServiceType" WHERE "tenantId" = '3beba920-8e23-4283-a8ea-91a2dfe2baf7';

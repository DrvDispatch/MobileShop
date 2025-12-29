-- Robust flagship sorting: newer models first within each tier
-- Format: sortOrder = BrandTier*1000 + DeviceTier*100 + (100 - ModelYear)
-- This ensures iPhone 17 Pro Max (10*100 + 10 + (100-17) = 1093) comes before iPhone 15 Pro Max (10*100 + 10 + (100-15) = 1095)

-- Reset all to 99999
UPDATE "Product" SET "sortOrder" = 99999;

-- ============================================
-- APPLE - Tier 1 (1xxx)
-- ============================================

-- iPhone Pro Max (sorted by model number, newest first)
UPDATE "Product" SET "sortOrder" = 1001 WHERE name ILIKE '%iPhone 17 Pro Max%';
UPDATE "Product" SET "sortOrder" = 1002 WHERE name ILIKE '%iPhone 16 Pro Max%';
UPDATE "Product" SET "sortOrder" = 1003 WHERE name ILIKE '%iPhone 15 Pro Max%';
UPDATE "Product" SET "sortOrder" = 1004 WHERE name ILIKE '%iPhone 14 Pro Max%';
UPDATE "Product" SET "sortOrder" = 1005 WHERE name ILIKE '%iPhone 13 Pro Max%';
UPDATE "Product" SET "sortOrder" = 1006 WHERE name ILIKE '%iPhone 12 Pro Max%';
UPDATE "Product" SET "sortOrder" = 1007 WHERE name ILIKE '%iPhone 11 Pro Max%';

-- iPhone Pro (not Pro Max)
UPDATE "Product" SET "sortOrder" = 1011 WHERE name ILIKE '%iPhone 17 Pro%' AND name NOT ILIKE '%Pro Max%';
UPDATE "Product" SET "sortOrder" = 1012 WHERE name ILIKE '%iPhone 16 Pro%' AND name NOT ILIKE '%Pro Max%';
UPDATE "Product" SET "sortOrder" = 1013 WHERE name ILIKE '%iPhone 15 Pro%' AND name NOT ILIKE '%Pro Max%';
UPDATE "Product" SET "sortOrder" = 1014 WHERE name ILIKE '%iPhone 14 Pro%' AND name NOT ILIKE '%Pro Max%';
UPDATE "Product" SET "sortOrder" = 1015 WHERE name ILIKE '%iPhone 13 Pro%' AND name NOT ILIKE '%Pro Max%';
UPDATE "Product" SET "sortOrder" = 1016 WHERE name ILIKE '%iPhone 12 Pro%' AND name NOT ILIKE '%Pro Max%';
UPDATE "Product" SET "sortOrder" = 1017 WHERE name ILIKE '%iPhone 11 Pro%' AND name NOT ILIKE '%Pro Max%';

-- iPhone Plus
UPDATE "Product" SET "sortOrder" = 1021 WHERE name ILIKE '%iPhone 16 Plus%';
UPDATE "Product" SET "sortOrder" = 1022 WHERE name ILIKE '%iPhone 15 Plus%';
UPDATE "Product" SET "sortOrder" = 1023 WHERE name ILIKE '%iPhone 14 Plus%';
UPDATE "Product" SET "sortOrder" = 1024 WHERE name ILIKE '%iPhone 13 Plus%';

-- iPhone (regular, newer first)
UPDATE "Product" SET "sortOrder" = 1031 WHERE name ILIKE '%iPhone 16%' AND "sortOrder" = 99999;
UPDATE "Product" SET "sortOrder" = 1032 WHERE name ILIKE '%iPhone 15%' AND "sortOrder" = 99999;
UPDATE "Product" SET "sortOrder" = 1033 WHERE name ILIKE '%iPhone 14%' AND "sortOrder" = 99999;
UPDATE "Product" SET "sortOrder" = 1034 WHERE name ILIKE '%iPhone 13%' AND "sortOrder" = 99999;
UPDATE "Product" SET "sortOrder" = 1035 WHERE name ILIKE '%iPhone 12%' AND "sortOrder" = 99999;
UPDATE "Product" SET "sortOrder" = 1036 WHERE name ILIKE '%iPhone 11%' AND "sortOrder" = 99999;
UPDATE "Product" SET "sortOrder" = 1040 WHERE name ILIKE '%iPhone SE%' AND "sortOrder" = 99999;
UPDATE "Product" SET "sortOrder" = 1050 WHERE name ILIKE '%iPhone%' AND "sortOrder" = 99999;

-- iPad Pro
UPDATE "Product" SET "sortOrder" = 1101 WHERE name ILIKE '%iPad Pro 12.9%';
UPDATE "Product" SET "sortOrder" = 1102 WHERE name ILIKE '%iPad Pro 11%';
UPDATE "Product" SET "sortOrder" = 1103 WHERE name ILIKE '%iPad Pro%' AND "sortOrder" = 99999;

-- iPad Air/Mini/Regular
UPDATE "Product" SET "sortOrder" = 1110 WHERE name ILIKE '%iPad Air%';
UPDATE "Product" SET "sortOrder" = 1120 WHERE name ILIKE '%iPad mini%';
UPDATE "Product" SET "sortOrder" = 1130 WHERE name ILIKE '%iPad%' AND "sortOrder" = 99999;

-- ============================================
-- SAMSUNG - Tier 2 (2xxx)
-- ============================================

-- Galaxy S Ultra (newest first)
UPDATE "Product" SET "sortOrder" = 2001 WHERE name ILIKE '%Galaxy S25 Ultra%';
UPDATE "Product" SET "sortOrder" = 2002 WHERE name ILIKE '%Galaxy S24 Ultra%';
UPDATE "Product" SET "sortOrder" = 2003 WHERE name ILIKE '%Galaxy S23 Ultra%';
UPDATE "Product" SET "sortOrder" = 2004 WHERE name ILIKE '%Galaxy S22 Ultra%';
UPDATE "Product" SET "sortOrder" = 2005 WHERE name ILIKE '%Galaxy S21 Ultra%';

-- Galaxy S Plus
UPDATE "Product" SET "sortOrder" = 2011 WHERE name ILIKE '%Galaxy S25+%';
UPDATE "Product" SET "sortOrder" = 2012 WHERE name ILIKE '%Galaxy S24+%';
UPDATE "Product" SET "sortOrder" = 2013 WHERE name ILIKE '%Galaxy S23+%';
UPDATE "Product" SET "sortOrder" = 2014 WHERE name ILIKE '%Galaxy S22+%';
UPDATE "Product" SET "sortOrder" = 2015 WHERE name ILIKE '%Galaxy S21+%';

-- Galaxy S (regular)
UPDATE "Product" SET "sortOrder" = 2021 WHERE name ILIKE '%Galaxy S25%' AND "sortOrder" = 99999;
UPDATE "Product" SET "sortOrder" = 2022 WHERE name ILIKE '%Galaxy S24%' AND "sortOrder" = 99999;
UPDATE "Product" SET "sortOrder" = 2023 WHERE name ILIKE '%Galaxy S23%' AND "sortOrder" = 99999;
UPDATE "Product" SET "sortOrder" = 2024 WHERE name ILIKE '%Galaxy S22%' AND "sortOrder" = 99999;
UPDATE "Product" SET "sortOrder" = 2025 WHERE name ILIKE '%Galaxy S21%' AND "sortOrder" = 99999;
UPDATE "Product" SET "sortOrder" = 2030 WHERE name ILIKE '%Galaxy S2%' AND "sortOrder" = 99999;

-- Galaxy Z Fold/Flip (newest first)
UPDATE "Product" SET "sortOrder" = 2050 WHERE name ILIKE '%Z Fold 6%';
UPDATE "Product" SET "sortOrder" = 2051 WHERE name ILIKE '%Z Fold 5%';
UPDATE "Product" SET "sortOrder" = 2052 WHERE name ILIKE '%Z Fold 4%';
UPDATE "Product" SET "sortOrder" = 2053 WHERE name ILIKE '%Z Fold%' AND "sortOrder" = 99999;
UPDATE "Product" SET "sortOrder" = 2060 WHERE name ILIKE '%Z Flip 6%';
UPDATE "Product" SET "sortOrder" = 2061 WHERE name ILIKE '%Z Flip 5%';
UPDATE "Product" SET "sortOrder" = 2062 WHERE name ILIKE '%Z Flip 4%';
UPDATE "Product" SET "sortOrder" = 2063 WHERE name ILIKE '%Z Flip%' AND "sortOrder" = 99999;

-- Galaxy A series
UPDATE "Product" SET "sortOrder" = 2100 WHERE name ILIKE '%Galaxy A5%' AND "sortOrder" = 99999;
UPDATE "Product" SET "sortOrder" = 2150 WHERE name ILIKE '%Galaxy A%' AND "sortOrder" = 99999;

-- Other Samsung
UPDATE "Product" SET "sortOrder" = 2500 WHERE brand = 'Samsung' AND "sortOrder" = 99999;

-- ============================================
-- GOOGLE - Tier 3 (3xxx)
-- ============================================

UPDATE "Product" SET "sortOrder" = 3001 WHERE name ILIKE '%Pixel 9 Pro XL%';
UPDATE "Product" SET "sortOrder" = 3002 WHERE name ILIKE '%Pixel 9 Pro%' AND name NOT ILIKE '%XL%';
UPDATE "Product" SET "sortOrder" = 3003 WHERE name ILIKE '%Pixel 8 Pro%';
UPDATE "Product" SET "sortOrder" = 3004 WHERE name ILIKE '%Pixel 7 Pro%';
UPDATE "Product" SET "sortOrder" = 3005 WHERE name ILIKE '%Pixel 6 Pro%';
UPDATE "Product" SET "sortOrder" = 3010 WHERE name ILIKE '%Pixel 9%' AND "sortOrder" = 99999;
UPDATE "Product" SET "sortOrder" = 3011 WHERE name ILIKE '%Pixel 8%' AND "sortOrder" = 99999;
UPDATE "Product" SET "sortOrder" = 3012 WHERE name ILIKE '%Pixel 7%' AND "sortOrder" = 99999;
UPDATE "Product" SET "sortOrder" = 3013 WHERE name ILIKE '%Pixel 6%' AND "sortOrder" = 99999;
UPDATE "Product" SET "sortOrder" = 3020 WHERE name ILIKE '%Pixel%' AND "sortOrder" = 99999;

-- ============================================
-- ONEPLUS - Tier 4 (4xxx)
-- ============================================

UPDATE "Product" SET "sortOrder" = 4001 WHERE name ILIKE '%OnePlus 13 Pro%' OR name ILIKE '%Oneplus 13 Pro%';
UPDATE "Product" SET "sortOrder" = 4002 WHERE name ILIKE '%OnePlus 12 Pro%' OR name ILIKE '%Oneplus 12 Pro%';
UPDATE "Product" SET "sortOrder" = 4003 WHERE name ILIKE '%OnePlus 11 Pro%' OR name ILIKE '%Oneplus 11 Pro%';
UPDATE "Product" SET "sortOrder" = 4004 WHERE name ILIKE '%OnePlus 10 Pro%' OR name ILIKE '%Oneplus 10 Pro%';
UPDATE "Product" SET "sortOrder" = 4010 WHERE (name ILIKE '%OnePlus%' OR name ILIKE '%Oneplus%') AND "sortOrder" = 99999;

-- ============================================
-- XIAOMI - Tier 5 (5xxx)
-- ============================================

UPDATE "Product" SET "sortOrder" = 5001 WHERE name ILIKE '%Xiaomi 14 Ultra%';
UPDATE "Product" SET "sortOrder" = 5002 WHERE name ILIKE '%Xiaomi 14 Pro%';
UPDATE "Product" SET "sortOrder" = 5003 WHERE name ILIKE '%Xiaomi 13 Ultra%';
UPDATE "Product" SET "sortOrder" = 5004 WHERE name ILIKE '%Xiaomi 13 Pro%';
UPDATE "Product" SET "sortOrder" = 5005 WHERE name ILIKE '%Xiaomi 12 Pro%';
UPDATE "Product" SET "sortOrder" = 5010 WHERE name ILIKE '%Xiaomi%Pro%' AND "sortOrder" = 99999;
UPDATE "Product" SET "sortOrder" = 5100 WHERE name ILIKE '%Poco%Pro%' AND "sortOrder" = 99999;
UPDATE "Product" SET "sortOrder" = 5500 WHERE brand = 'Xiaomi' AND "sortOrder" = 99999;

-- ============================================
-- OTHER BRANDS - Tier 6+ (6xxx-9xxx)
-- ============================================

-- Huawei
UPDATE "Product" SET "sortOrder" = 6001 WHERE name ILIKE '%Huawei%Pro%' OR name ILIKE '%Huawei%Ultra%';
UPDATE "Product" SET "sortOrder" = 6100 WHERE brand = 'Huawei' AND "sortOrder" = 99999;

-- Motorola
UPDATE "Product" SET "sortOrder" = 7001 WHERE name ILIKE '%Motorola%Ultra%';
UPDATE "Product" SET "sortOrder" = 7100 WHERE brand = 'Motorola' AND "sortOrder" = 99999;

-- Sony
UPDATE "Product" SET "sortOrder" = 7500 WHERE brand = 'Sony' AND "sortOrder" = 99999;

-- Nokia, Fairphone, Asus, Cat, Lenovo
UPDATE "Product" SET "sortOrder" = 8000 WHERE brand IN ('Nokia', 'Fairphone', 'Asus', 'Cat', 'Lenovo') AND "sortOrder" = 99999;

-- Everything else
UPDATE "Product" SET "sortOrder" = 9000 WHERE "sortOrder" = 99999;

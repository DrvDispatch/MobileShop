-- Delete duplicate products, keeping only the one with lowest sortOrder (or earliest created)
-- First, identify and delete duplicates

DELETE FROM "Product"
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY name ORDER BY "sortOrder" ASC, "createdAt" ASC) as rn
        FROM "Product"
    ) duplicates
    WHERE rn > 1
);

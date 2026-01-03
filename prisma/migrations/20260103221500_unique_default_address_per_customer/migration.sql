WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "customerId"
      ORDER BY "updatedAt" DESC, "createdAt" DESC
    ) AS rn
  FROM "addresses"
  WHERE "isDefault" = true
)
UPDATE "addresses" a
SET "isDefault" = false
FROM ranked r
WHERE a."id" = r."id"
  AND r.rn > 1;

CREATE UNIQUE INDEX "addresses_one_default_per_customer"
ON "addresses" ("customerId")
WHERE "isDefault" = true;


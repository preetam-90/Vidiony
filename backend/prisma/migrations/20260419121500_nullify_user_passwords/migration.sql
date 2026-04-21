ALTER TABLE "users"
  ALTER COLUMN "password" DROP NOT NULL;

UPDATE "users"
SET "password" = NULL
WHERE "password" IS NOT NULL;

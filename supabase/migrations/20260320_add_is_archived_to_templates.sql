ALTER TABLE "public"."procedure_templates" ADD COLUMN "is_archived" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "idx_procedure_templates_is_archived" ON "public"."procedure_templates" ("is_archived");

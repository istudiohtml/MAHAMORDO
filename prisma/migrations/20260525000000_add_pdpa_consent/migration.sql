-- AlterTable: add PDPA / consent fields to users
ALTER TABLE "users"
  ADD COLUMN "consentVersion"        TEXT,
  ADD COLUMN "consentAcceptedAt"     TIMESTAMP(3),
  ADD COLUMN "marketingConsent"      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "dataExportRequestedAt" TIMESTAMP(3),
  ADD COLUMN "deletionRequestedAt"   TIMESTAMP(3);

-- AlterTable
ALTER TABLE "fortune_sessions" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '24 hours';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "stripeCustomerId" TEXT;

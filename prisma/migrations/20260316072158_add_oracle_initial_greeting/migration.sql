-- AlterTable
ALTER TABLE "fortune_sessions" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '24 hours';

-- AlterTable
ALTER TABLE "oracles" ADD COLUMN     "initialGreeting" TEXT NOT NULL DEFAULT 'สวัสดีค่ะ';

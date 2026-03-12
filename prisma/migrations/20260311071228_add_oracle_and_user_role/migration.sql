/*
  Warnings:

  - You are about to drop the column `oracle` on the `fortune_sessions` table. All the data in the column will be lost.
  - Added the required column `oracleId` to the `fortune_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPERADMIN');

-- AlterTable
ALTER TABLE "fortune_sessions" DROP COLUMN "oracle",
ADD COLUMN     "oracleId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- DropEnum
DROP TYPE "OracleType";

-- CreateTable
CREATE TABLE "oracles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "systemPrompt" TEXT NOT NULL,
    "speciality" TEXT NOT NULL,
    "creditCost" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oracles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oracles_slug_key" ON "oracles"("slug");

-- AddForeignKey
ALTER TABLE "fortune_sessions" ADD CONSTRAINT "fortune_sessions_oracleId_fkey" FOREIGN KEY ("oracleId") REFERENCES "oracles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

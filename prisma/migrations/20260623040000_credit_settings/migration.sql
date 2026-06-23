-- AlterTable: new users start with 0 credits; signup bonus applied via system settings
ALTER TABLE `users` MODIFY `credits` INTEGER NOT NULL DEFAULT 0;

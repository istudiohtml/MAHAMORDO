-- CreateTable
CREATE TABLE `daily_coin_flips` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `userChoice` VARCHAR(191) NOT NULL,
    `outcome` VARCHAR(191) NOT NULL,
    `matched` BOOLEAN NOT NULL,
    `headline` VARCHAR(200) NOT NULL,
    `message` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `daily_coin_flips_userId_date_idx`(`userId`, `date` DESC),
    UNIQUE INDEX `daily_coin_flips_userId_date_key`(`userId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `daily_coin_flips` ADD CONSTRAINT `daily_coin_flips_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

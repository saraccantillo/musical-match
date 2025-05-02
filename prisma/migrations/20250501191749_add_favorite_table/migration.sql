-- CreateTable
CREATE TABLE `favorite` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `musicianId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Favorite_clientId_musicianId_key`(`clientId`, `musicianId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `favorite` ADD CONSTRAINT `Favorite_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorite` ADD CONSTRAINT `Favorite_musicianId_fkey` FOREIGN KEY (`musicianId`) REFERENCES `musician`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

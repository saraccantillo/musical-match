-- AlterTable
ALTER TABLE `musician` ADD COLUMN `maxPrice` DECIMAL(10, 2) NULL,
    ADD COLUMN `minPrice` DECIMAL(10, 2) NULL;

-- CreateTable
CREATE TABLE `event` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `musicianevent` (
    `id` VARCHAR(191) NOT NULL,
    `musicianId` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,

    INDEX `MusicianEvent_eventId_fkey`(`eventId`),
    UNIQUE INDEX `MusicianEvent_musicianId_eventId_key`(`musicianId`, `eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `musicianevent` ADD CONSTRAINT `MusicianEvent_musicianId_fkey` FOREIGN KEY (`musicianId`) REFERENCES `musician`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `musicianevent` ADD CONSTRAINT `MusicianEvent_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `event`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

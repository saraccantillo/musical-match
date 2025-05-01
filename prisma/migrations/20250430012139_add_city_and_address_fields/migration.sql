-- AlterTable
ALTER TABLE `client` ADD COLUMN `address` VARCHAR(255) NULL,
    ADD COLUMN `cityId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `musician` ADD COLUMN `address` VARCHAR(255) NULL,
    ADD COLUMN `cityId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `department` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `city` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `departmentId` VARCHAR(191) NOT NULL,

    INDEX `City_departmentId_fkey`(`departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Client_cityId_fkey` ON `client`(`cityId`);

-- CreateIndex
CREATE INDEX `Musician_cityId_fkey` ON `musician`(`cityId`);

-- AddForeignKey
ALTER TABLE `city` ADD CONSTRAINT `City_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `client` ADD CONSTRAINT `Client_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `city`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `musician` ADD CONSTRAINT `Musician_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `city`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `Message_reservationId_fkey`;

-- AlterTable
ALTER TABLE `message` MODIFY `reservationId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `message` ADD CONSTRAINT `Message_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `reservation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

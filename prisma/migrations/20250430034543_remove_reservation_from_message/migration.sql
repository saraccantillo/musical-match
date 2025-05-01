/*
  Warnings:

  - You are about to drop the column `reservationId` on the `message` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `Message_reservationId_fkey`;

-- DropIndex
DROP INDEX `Message_reservationId_fkey` ON `message`;

-- AlterTable
ALTER TABLE `message` DROP COLUMN `reservationId`;

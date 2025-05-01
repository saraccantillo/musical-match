-- DropIndex
DROP INDEX `message_senderId_idx` ON `message`;

-- AlterTable
ALTER TABLE `message` ADD COLUMN `senderType` VARCHAR(191) NOT NULL DEFAULT 'CLIENT';

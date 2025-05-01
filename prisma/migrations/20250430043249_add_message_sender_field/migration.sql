/*
  Warnings:

  - Added the required column `senderId` to the `message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `message` ADD COLUMN `senderId` VARCHAR(191) NULL;

-- Actualizar registros existentes, asumiendo que el cliente fue quien envió los mensajes
UPDATE `message` SET `senderId` = `clientId` WHERE `senderId` IS NULL;

-- Ahora hacer la columna NOT NULL
ALTER TABLE `message` MODIFY COLUMN `senderId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `message_senderId_idx` ON `message`(`senderId`);

-- CreateTable
CREATE TABLE `conversation` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `musicianId` VARCHAR(191) NOT NULL,
    `messages` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Conversation_clientId_fkey`(`clientId`),
    INDEX `Conversation_musicianId_fkey`(`musicianId`),
    UNIQUE INDEX `Conversation_clientId_musicianId_key`(`clientId`, `musicianId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `message_senderId_idx` ON `message`(`senderId`);

-- AddForeignKey
ALTER TABLE `conversation` ADD CONSTRAINT `Conversation_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation` ADD CONSTRAINT `Conversation_musicianId_fkey` FOREIGN KEY (`musicianId`) REFERENCES `musician`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

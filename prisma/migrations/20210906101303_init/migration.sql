-- CreateTable
CREATE TABLE `Prospect` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalId` VARCHAR(255) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `type` ENUM('TYPE_ONE', 'TYPE_TWO') NOT NULL DEFAULT 'TYPE_ONE',

    UNIQUE INDEX `externalId`(`externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

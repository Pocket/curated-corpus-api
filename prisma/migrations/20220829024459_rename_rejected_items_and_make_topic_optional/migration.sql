/*
  Warnings:

  - You are about to drop the `RejectedCuratedCorpusItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `RejectedCuratedCorpusItem`;

-- CreateTable
CREATE TABLE `RejectedItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalId` VARCHAR(255) NOT NULL,
    `prospectId` VARCHAR(255) NULL,
    `url` VARCHAR(500) NOT NULL,
    `title` VARCHAR(255) NULL,
    `topic` VARCHAR(255) NULL,
    `language` VARCHAR(2) NULL,
    `publisher` VARCHAR(255) NULL,
    `reason` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `RejectedItem_externalId_key`(`externalId`),
    UNIQUE INDEX `RejectedItem_url_key`(`url`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

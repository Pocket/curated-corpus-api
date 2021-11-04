/*
  Warnings:

  - You are about to drop the column `newTabFeedId` on the `NewTabFeedSchedule` table. All the data in the column will be lost.
  - You are about to drop the `NewTabFeed` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `NewTabFeedSchedule` DROP FOREIGN KEY `NewTabFeedSchedule_newTabFeedId_fkey`;

-- AlterTable
ALTER TABLE `NewTabFeedSchedule` DROP COLUMN `newTabFeedId`,
    ADD COLUMN `newTabGuid` ENUM('EN_US', 'DE_DE') NOT NULL DEFAULT 'EN_US';

-- DropTable
DROP TABLE `NewTabFeed`;

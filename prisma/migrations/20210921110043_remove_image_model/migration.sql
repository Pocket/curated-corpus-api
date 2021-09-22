/*
  Warnings:

  - You are about to drop the column `curatedImageId` on the `CuratedItem` table. All the data in the column will be lost.
  - You are about to drop the `CuratedItemImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `CuratedItem` DROP FOREIGN KEY `CuratedItem_curatedImageId_fkey`;

-- AlterTable
ALTER TABLE `CuratedItem` DROP COLUMN `curatedImageId`,
    ADD COLUMN `imageUrl` VARCHAR(191),
    MODIFY `updatedBy` VARCHAR(191);

-- AlterTable
ALTER TABLE `NewTabFeedSchedule` MODIFY `updatedBy` VARCHAR(191),
    MODIFY `approvedBy` VARCHAR(191);

-- DropTable
DROP TABLE `CuratedItemImage`;

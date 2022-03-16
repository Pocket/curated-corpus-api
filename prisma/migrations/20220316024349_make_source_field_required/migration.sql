/*
  Warnings:

  - Made the column `source` on table `ApprovedItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `ApprovedItem` MODIFY `source` ENUM('PROSPECT', 'MANUAL', 'BACKFILL') NOT NULL;

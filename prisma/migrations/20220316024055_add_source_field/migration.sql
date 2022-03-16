-- AlterTable
ALTER TABLE `ApprovedItem` ADD COLUMN `source` ENUM('PROSPECT', 'MANUAL', 'BACKFILL') NULL;

-- Set a default `source` value for any existing entries
UPDATE ApprovedItem SET source = 'PROSPECT';
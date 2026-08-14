-- AlterTable
ALTER TABLE `ojt_content_items` DROP COLUMN `instructorSignedDate`,
    ADD COLUMN `timeFrom` VARCHAR(191) NULL,
    ADD COLUMN `timeTo` VARCHAR(191) NULL,
    ADD COLUMN `trainingDate` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `ojt_sessions` DROP COLUMN `courseName`,
    DROP COLUMN `instructor`,
    DROP COLUMN `location`,
    DROP COLUMN `timeRange`,
    DROP COLUMN `trainingDateFrom`,
    DROP COLUMN `trainingDateTo`;

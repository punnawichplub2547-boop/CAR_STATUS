-- AlterTable
ALTER TABLE `ojt_participants` ADD COLUMN `position` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ojt_sessions` ADD COLUMN `changeReasonOtherDetail` VARCHAR(191) NULL,
    ADD COLUMN `courseTitle` VARCHAR(191) NULL,
    ADD COLUMN `instructorName1` VARCHAR(191) NULL,
    ADD COLUMN `instructorName2` VARCHAR(191) NULL,
    ADD COLUMN `location` VARCHAR(191) NULL,
    ADD COLUMN `timeFrom` VARCHAR(191) NULL,
    ADD COLUMN `timeTo` VARCHAR(191) NULL,
    ADD COLUMN `trainingDate` DATETIME(3) NULL;

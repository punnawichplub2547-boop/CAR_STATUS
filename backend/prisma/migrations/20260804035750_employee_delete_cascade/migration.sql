-- DropForeignKey
ALTER TABLE `training_attendances` DROP FOREIGN KEY `training_attendances_employeeId_fkey`;

-- DropIndex
DROP INDEX `training_attendances_employeeId_fkey` ON `training_attendances`;

-- AddForeignKey
ALTER TABLE `training_attendances` ADD CONSTRAINT `training_attendances_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

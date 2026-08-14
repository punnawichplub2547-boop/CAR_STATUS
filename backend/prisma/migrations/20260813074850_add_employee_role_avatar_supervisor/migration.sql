-- AlterTable
ALTER TABLE `employees` ADD COLUMN `avatar` LONGTEXT NULL,
    ADD COLUMN `role` VARCHAR(191) NOT NULL DEFAULT 'EMPLOYEE',
    ADD COLUMN `supervisorId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

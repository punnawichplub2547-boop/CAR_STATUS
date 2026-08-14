-- CreateTable
CREATE TABLE `skill_evaluations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employeeId` INTEGER NULL,
    `employeeName` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `position` VARCHAR(191) NOT NULL,
    `skillName` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `targetLevel` INTEGER NOT NULL,
    `resultLevel` INTEGER NOT NULL,
    `cycle` VARCHAR(191) NOT NULL,
    `attemptNumber` INTEGER NOT NULL,
    `evaluatedAt` DATETIME(3) NOT NULL,
    `assessorName` VARCHAR(191) NOT NULL,
    `remark` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `skill_evaluations_employeeId_cycle_idx`(`employeeId`, `cycle`),
    UNIQUE INDEX `skill_evaluations_employeeId_skillName_cycle_attemptNumber_key`(`employeeId`, `skillName`, `cycle`, `attemptNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `skill_evaluation_rounds` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employeeId` INTEGER NULL,
    `cycle` VARCHAR(191) NOT NULL,
    `attemptNumber` INTEGER NOT NULL,
    `actionPeriodFrom` DATETIME(3) NULL,
    `actionPeriodTo` DATETIME(3) NULL,
    `assessorName` VARCHAR(191) NOT NULL,
    `assessorSignature` LONGTEXT NULL,
    `deptManagerName` VARCHAR(191) NULL,
    `deptManagerSignature` LONGTEXT NULL,
    `hrDeptName` VARCHAR(191) NULL,
    `hrDeptSignature` LONGTEXT NULL,
    `signedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `skill_evaluation_rounds_employeeId_cycle_attemptNumber_key`(`employeeId`, `cycle`, `attemptNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `skill_evaluations` ADD CONSTRAINT `skill_evaluations_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `skill_evaluation_rounds` ADD CONSTRAINT `skill_evaluation_rounds_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE `ojt_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `formType` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `position` VARCHAR(191) NOT NULL,
    `courseName` VARCHAR(191) NOT NULL,
    `instructor` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `trainingDateFrom` DATETIME(3) NOT NULL,
    `trainingDateTo` DATETIME(3) NOT NULL,
    `timeRange` VARCHAR(191) NOT NULL,
    `evaluationMethod` VARCHAR(191) NOT NULL,
    `hasAttachment` BOOLEAN NOT NULL DEFAULT false,
    `purposeType` VARCHAR(191) NULL,
    `changeReasonCategory` VARCHAR(191) NULL,
    `assessorName` VARCHAR(191) NOT NULL,
    `managerName` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ojt_content_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` INTEGER NOT NULL,
    `sequence` INTEGER NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `instructorSignedDate` DATETIME(3) NULL,
    `resultPercent` INTEGER NULL,
    `remark` VARCHAR(191) NULL,

    UNIQUE INDEX `ojt_content_items_sessionId_sequence_key`(`sessionId`, `sequence`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ojt_participants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` INTEGER NOT NULL,
    `empCode` VARCHAR(191) NOT NULL,
    `employeeId` INTEGER NULL,
    `employeeName` VARCHAR(191) NOT NULL,
    `preScore` INTEGER NULL,
    `postScore` INTEGER NULL,
    `instructorScorePercent` INTEGER NOT NULL,
    `isPassed` BOOLEAN NOT NULL,
    `remarks` VARCHAR(191) NULL,

    INDEX `ojt_participants_empCode_idx`(`empCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `probation_evaluations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `empCode` VARCHAR(191) NOT NULL,
    `employeeId` INTEGER NULL,
    `employeeName` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `position` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `startingDate` DATETIME(3) NOT NULL,
    `evalDate` DATETIME(3) NOT NULL,
    `knowledge` INTEGER NOT NULL,
    `diligence` INTEGER NOT NULL,
    `responsibility` INTEGER NOT NULL,
    `teamwork` INTEGER NOT NULL,
    `attitude` INTEGER NOT NULL,
    `regulationCompliance` INTEGER NOT NULL,
    `problemSolving` INTEGER NOT NULL,
    `learningAbility` INTEGER NOT NULL,
    `ppeUse` INTEGER NOT NULL,
    `activityParticipation` INTEGER NOT NULL,
    `criteriaTotalScore` INTEGER NOT NULL,
    `criteriaPercentage` DOUBLE NOT NULL,
    `attendancePercentage` DOUBLE NOT NULL,
    `resultScore` DOUBLE NOT NULL,
    `grade` VARCHAR(191) NOT NULL,
    `isPassed` BOOLEAN NOT NULL,
    `comments` TEXT NULL,
    `assessorName` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `probation_evaluations_empCode_idx`(`empCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ojt_content_items` ADD CONSTRAINT `ojt_content_items_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `ojt_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ojt_participants` ADD CONSTRAINT `ojt_participants_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `ojt_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ojt_participants` ADD CONSTRAINT `ojt_participants_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `probation_evaluations` ADD CONSTRAINT `probation_evaluations_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

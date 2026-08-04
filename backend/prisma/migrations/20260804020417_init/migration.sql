-- CreateTable
CREATE TABLE `employees` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `empCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `department` VARCHAR(191) NOT NULL,
    `section` VARCHAR(191) NULL,
    `position` VARCHAR(191) NOT NULL,
    `startingDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PROBATION',
    `orientationPassed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `employees_empCode_key`(`empCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_courses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `training_courses_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_attendances` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` INTEGER NOT NULL,
    `employeeId` INTEGER NOT NULL,
    `trainingDate` DATETIME(3) NOT NULL,
    `timeRange` VARCHAR(191) NOT NULL,
    `instructor` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `checkInMorning` VARCHAR(191) NULL,
    `checkInAfternoon` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `training_attendances_courseId_employeeId_trainingDate_key`(`courseId`, `employeeId`, `trainingDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_submissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `formResponseId` VARCHAR(191) NOT NULL,
    `courseId` INTEGER NULL,
    `courseCategory` VARCHAR(191) NOT NULL,
    `empCode` VARCHAR(191) NOT NULL,
    `employeeId` INTEGER NULL,
    `respondentName` VARCHAR(191) NOT NULL,
    `respondentEmail` VARCHAR(191) NULL,
    `totalQuestions` INTEGER NOT NULL,
    `correctCount` INTEGER NOT NULL,
    `wrongCount` INTEGER NOT NULL,
    `percentage` DOUBLE NOT NULL,
    `isPassed` BOOLEAN NOT NULL,
    `submittedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `exam_submissions_formResponseId_key`(`formResponseId`),
    INDEX `exam_submissions_empCode_idx`(`empCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `training_attendances` ADD CONSTRAINT `training_attendances_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `training_courses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_attendances` ADD CONSTRAINT `training_attendances_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_submissions` ADD CONSTRAINT `exam_submissions_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `training_courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_submissions` ADD CONSTRAINT `exam_submissions_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE `skill_standards` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `department` VARCHAR(191) NOT NULL,
    `position` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `skillName` VARCHAR(191) NOT NULL,
    `targetLevel` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `skill_standards_department_position_idx`(`department`, `position`),
    UNIQUE INDEX `skill_standards_department_position_category_skillName_key`(`department`, `position`, `category`, `skillName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

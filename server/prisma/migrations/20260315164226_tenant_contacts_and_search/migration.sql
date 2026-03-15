/*
  Warnings:

  - You are about to drop the column `contactPerson` on the `Tenant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Tenant` DROP COLUMN `contactPerson`;

-- CreateTable
CREATE TABLE `TenantContact` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `mobile` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `notes` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TenantContact_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Tenant_name_idx` ON `Tenant`(`name`);

-- CreateIndex
CREATE INDEX `Tenant_city_idx` ON `Tenant`(`city`);

-- AddForeignKey
ALTER TABLE `TenantContact` ADD CONSTRAINT `TenantContact_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

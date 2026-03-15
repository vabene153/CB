-- AlterTable
ALTER TABLE `Tenant` ADD COLUMN `billingCity` VARCHAR(191) NULL,
    ADD COLUMN `billingCountry` VARCHAR(191) NULL DEFAULT 'Deutschland',
    ADD COLUMN `billingName` VARCHAR(191) NULL,
    ADD COLUMN `billingPostalCode` VARCHAR(191) NULL,
    ADD COLUMN `billingStreet` VARCHAR(191) NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `contactPerson` VARCHAR(191) NULL,
    ADD COLUMN `country` VARCHAR(191) NULL DEFAULT 'Deutschland',
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `notes` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `postalCode` VARCHAR(191) NULL,
    ADD COLUMN `street` VARCHAR(191) NULL;

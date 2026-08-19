CREATE TABLE `courierOperations` (
	`courierId` int NOT NULL,
	`availability` enum('offline','available','busy','break') NOT NULL DEFAULT 'offline',
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`accuracy` decimal(8,2),
	`lastLocationAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courierOperations_courierId` PRIMARY KEY(`courierId`)
);
--> statement-breakpoint
CREATE TABLE `pricingSettings` (
	`id` int NOT NULL,
	`openingFeeTl` decimal(10,2) NOT NULL,
	`ratePerKmTl` decimal(10,2) NOT NULL,
	`commissionRate` decimal(5,4) NOT NULL,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pricingSettings_id` PRIMARY KEY(`id`)
);

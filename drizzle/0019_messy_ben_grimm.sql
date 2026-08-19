CREATE TABLE `provinceCoverage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provinceName` varchar(80) NOT NULL,
	`isEnabled` int NOT NULL DEFAULT 0,
	`operatingStart` varchar(5) NOT NULL DEFAULT '08:00',
	`operatingEnd` varchar(5) NOT NULL DEFAULT '22:00',
	`etaBufferMinutes` int NOT NULL DEFAULT 30,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `provinceCoverage_id` PRIMARY KEY(`id`),
	CONSTRAINT `provinceCoverage_provinceName_unique` UNIQUE(`provinceName`)
);

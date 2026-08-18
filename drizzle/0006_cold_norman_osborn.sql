CREATE TABLE `courierDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courierId` int NOT NULL,
	`documentType` enum('identity','license','vehicle_registration') NOT NULL,
	`storageKey` varchar(320) NOT NULL,
	`storageUrl` varchar(420) NOT NULL,
	`originalName` varchar(180) NOT NULL,
	`contentType` varchar(80) NOT NULL,
	`sizeBytes` int NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewNote` varchar(500),
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `courierDocuments_id` PRIMARY KEY(`id`)
);

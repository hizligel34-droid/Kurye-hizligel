CREATE TABLE `courierContracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courierId` int NOT NULL,
	`contractVersion` varchar(40) NOT NULL,
	`courierFullName` varchar(160) NOT NULL,
	`identityNumber` varchar(32) NOT NULL,
	`residenceAddress` varchar(320) NOT NULL,
	`taxOffice` varchar(120) NOT NULL,
	`taxNumber` varchar(40) NOT NULL,
	`vehiclePlate` varchar(20) NOT NULL,
	`iban` varchar(34) NOT NULL,
	`acceptedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courierContracts_id` PRIMARY KEY(`id`),
	CONSTRAINT `courierContracts_courierId_unique` UNIQUE(`courierId`)
);

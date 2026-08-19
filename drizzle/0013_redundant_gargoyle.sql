CREATE TABLE `savedAddresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(80) NOT NULL,
	`province` varchar(80) NOT NULL,
	`district` varchar(100) NOT NULL,
	`neighborhood` varchar(140) NOT NULL,
	`street` varchar(180) NOT NULL,
	`buildingNo` varchar(30) NOT NULL,
	`apartmentNo` varchar(30) NOT NULL DEFAULT '',
	`floor` varchar(20) NOT NULL DEFAULT '',
	`courierNote` varchar(500) NOT NULL DEFAULT '',
	`addressDetail` varchar(240) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedAddresses_id` PRIMARY KEY(`id`)
);

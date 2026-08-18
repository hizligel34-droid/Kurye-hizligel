CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`senderId` int,
	`senderRole` enum('customer','courier','operator','bot') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`orderId` int,
	`title` varchar(160) NOT NULL,
	`content` text NOT NULL,
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trackingCode` varchar(24) NOT NULL,
	`customerId` int NOT NULL,
	`courierId` int,
	`pickupAddress` text NOT NULL,
	`deliveryAddress` text NOT NULL,
	`productDescription` text NOT NULL,
	`customerPhone` varchar(32) NOT NULL,
	`distanceKm` decimal(8,2) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	`commission` decimal(10,2) NOT NULL,
	`courierEarning` decimal(10,2) NOT NULL,
	`companyRevenue` decimal(10,2) NOT NULL,
	`status` enum('received','on_the_way','delivered','cancelled') NOT NULL DEFAULT 'received',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_trackingCode_unique` UNIQUE(`trackingCode`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','courier','accountant') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);
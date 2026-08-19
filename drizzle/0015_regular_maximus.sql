CREATE TABLE `platformSettings` (
	`id` int NOT NULL,
	`ordersEnabled` int NOT NULL DEFAULT 1,
	`courierPortalEnabled` int NOT NULL DEFAULT 1,
	`storePortalEnabled` int NOT NULL DEFAULT 1,
	`liveTrackingEnabled` int NOT NULL DEFAULT 1,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','courier','store','accountant') NOT NULL DEFAULT 'user';
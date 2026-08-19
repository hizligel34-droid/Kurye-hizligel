ALTER TABLE `orders` MODIFY COLUMN `paymentStatus` enum('pending','paid','collect_on_delivery','failed','refunded') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryOtpHash` varchar(64) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryPhotoKey` varchar(360);--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryPhotoUrl` varchar(480);--> statement-breakpoint
ALTER TABLE `orders` ADD `assignedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveredAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `cancelledAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `cancelledByRole` varchar(20);--> statement-breakpoint
ALTER TABLE `orders` ADD `cancellationReason` varchar(300);
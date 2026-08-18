ALTER TABLE `orders` ADD `paymentMethod` enum('sandbox_card','cash_on_delivery') DEFAULT 'sandbox_card' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentStatus` enum('pending','paid','collect_on_delivery','failed') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentReference` varchar(80);
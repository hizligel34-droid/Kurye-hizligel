ALTER TABLE `orders` ADD `pickupPostalCode` varchar(5) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryPostalCode` varchar(5) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `savedAddresses` ADD `postalCode` varchar(5) DEFAULT '' NOT NULL;
ALTER TABLE `orders` ADD `pickupApartmentNo` varchar(30) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `pickupFloor` varchar(20) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `pickupCourierNote` varchar(500) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryApartmentNo` varchar(30) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryFloor` varchar(20) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryCourierNote` varchar(500) DEFAULT '' NOT NULL;
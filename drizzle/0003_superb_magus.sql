ALTER TABLE `orders` ADD `pickupProvince` varchar(80) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `pickupDistrict` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `pickupNeighborhood` varchar(140) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `pickupStreet` varchar(180) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryProvince` varchar(80) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryDistrict` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryNeighborhood` varchar(140) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryStreet` varchar(180) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `routeDurationMinutes` decimal(8,1) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `routeStatus` enum('verified','unavailable') DEFAULT 'verified' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `routeProvider` varchar(40) DEFAULT 'google_driving' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `pickupLatitude` decimal(10,7);--> statement-breakpoint
ALTER TABLE `orders` ADD `pickupLongitude` decimal(10,7);--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryLatitude` decimal(10,7);--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryLongitude` decimal(10,7);
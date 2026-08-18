ALTER TABLE `messages` ADD `attachmentKey` varchar(360);--> statement-breakpoint
ALTER TABLE `messages` ADD `attachmentUrl` varchar(480);--> statement-breakpoint
ALTER TABLE `messages` ADD `attachmentContentType` varchar(80);--> statement-breakpoint
ALTER TABLE `messages` ADD `attachmentName` varchar(180);--> statement-breakpoint
ALTER TABLE `messages` ADD `attachmentSizeBytes` int;
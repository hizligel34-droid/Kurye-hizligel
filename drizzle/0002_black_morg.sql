ALTER TABLE `messages` ADD `detectedLanguage` varchar(16) DEFAULT 'tr' NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `translatedContent` text;
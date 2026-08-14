ALTER TABLE `users` ADD `onboarded_at` timestamp;--> statement-breakpoint
UPDATE `users` SET `onboarded_at` = `created_at` WHERE `onboarded_at` IS NULL;

ALTER TABLE `users` ADD `birth_date` date;--> statement-breakpoint
ALTER TABLE `users` ADD `gender` enum('male','female','other');--> statement-breakpoint
ALTER TABLE `users` ADD `height_cm` smallint;--> statement-breakpoint
ALTER TABLE `users` ADD `goal_kg` decimal(5,2);--> statement-breakpoint
ALTER TABLE `users` ADD `goal_text` varchar(120);--> statement-breakpoint
ALTER TABLE `users` ADD `started_at` date;
CREATE TABLE `habit_completions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`habit_id` int NOT NULL,
	`user_id` varchar(26) NOT NULL,
	`completed_on` date NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `habit_completions_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_habit_date` UNIQUE(`habit_id`,`completed_on`)
);
--> statement-breakpoint
CREATE TABLE `habits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(26) NOT NULL,
	`name` varchar(80) NOT NULL,
	`cadence` enum('daily','weekly') NOT NULL,
	`weekly_target` int,
	`weight` enum('light','standard','heavy') NOT NULL DEFAULT 'standard',
	`archived_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `habits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `xp_events` MODIFY COLUMN `event_type` enum('session_complete','set_logged','measurement_added','photo_uploaded','nutrition_logged','pr_achieved','streak_day','habit_streak') NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_completions_user_date` ON `habit_completions` (`user_id`,`completed_on`);--> statement-breakpoint
CREATE INDEX `idx_habits_user_active` ON `habits` (`user_id`,`archived_at`);
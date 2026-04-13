CREATE TABLE `accounts` (
	`user_id` varchar(26) NOT NULL,
	`type` varchar(32) NOT NULL,
	`provider` varchar(32) NOT NULL,
	`provider_account_id` varchar(255) NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` int,
	`token_type` varchar(32),
	`scope` varchar(255),
	`id_token` text,
	`session_state` varchar(255),
	CONSTRAINT `accounts_provider_provider_account_id_pk` PRIMARY KEY(`provider`,`provider_account_id`)
);
--> statement-breakpoint
CREATE TABLE `body_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(26) NOT NULL,
	`taken_at` date NOT NULL,
	`week_start` date,
	`pose` enum('front','side','back','other') NOT NULL,
	`storage_key` varchar(255) NOT NULL,
	`width_px` smallint,
	`height_px` smallint,
	`byte_size` int,
	`note` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `body_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exercise_muscle_groups` (
	`exercise_id` int NOT NULL,
	`muscle_group_id` smallint NOT NULL,
	`is_primary` boolean NOT NULL DEFAULT false,
	CONSTRAINT `exercise_muscle_groups_exercise_id_muscle_group_id_pk` PRIMARY KEY(`exercise_id`,`muscle_group_id`)
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(26),
	`name` varchar(128) NOT NULL,
	`type` enum('barbell','db','cable','machine','bodyweight','smith') NOT NULL,
	`video_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `measurements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(26) NOT NULL,
	`week_start` date NOT NULL,
	`weight_kg` decimal(5,2),
	`waist_cm` decimal(4,1),
	`chest_cm` decimal(4,1),
	`thigh_cm` decimal(4,1),
	`biceps_cm` decimal(4,1),
	`target_kcal` smallint,
	`note` text,
	CONSTRAINT `measurements_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_user_week` UNIQUE(`user_id`,`week_start`)
);
--> statement-breakpoint
CREATE TABLE `muscle_groups` (
	`id` smallint AUTO_INCREMENT NOT NULL,
	`slug` varchar(32) NOT NULL,
	`name` varchar(64) NOT NULL,
	CONSTRAINT `muscle_groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `muscle_groups_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `nutrition_days` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(26) NOT NULL,
	`date` date NOT NULL,
	`kcal_actual` smallint,
	`protein_g` smallint,
	`note` text,
	CONSTRAINT `nutrition_days_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_user_date` UNIQUE(`user_id`,`date`)
);
--> statement-breakpoint
CREATE TABLE `plan_exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plan_id` int NOT NULL,
	`exercise_id` int NOT NULL,
	`order` tinyint NOT NULL,
	`target_sets` tinyint NOT NULL,
	`rep_min` tinyint NOT NULL,
	`rep_max` tinyint NOT NULL,
	`rest_sec` smallint NOT NULL,
	CONSTRAINT `plan_exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(26) NOT NULL,
	`name` varchar(32) NOT NULL,
	`slug` varchar(16) NOT NULL,
	`order` tinyint NOT NULL,
	CONSTRAINT `plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_sets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`exercise_id` int NOT NULL,
	`set_index` tinyint NOT NULL,
	`weight_kg` decimal(5,2),
	`reps` tinyint,
	`rpe` tinyint,
	`completed_at` timestamp DEFAULT (now()),
	CONSTRAINT `session_sets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(26) NOT NULL,
	`plan_id` int,
	`started_at` timestamp NOT NULL,
	`finished_at` timestamp,
	`note` text,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(26) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255),
	`name` varchar(100),
	`level` tinyint NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `xp_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(26) NOT NULL,
	`event_type` enum('session_complete','set_logged','measurement_added','photo_uploaded','nutrition_logged','pr_achieved','streak_day') NOT NULL,
	`xp_delta` smallint NOT NULL,
	`session_id` int,
	`meta` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `xp_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_accounts_user` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_body_photos_user_date` ON `body_photos` (`user_id`,`taken_at`);--> statement-breakpoint
CREATE INDEX `idx_exercises_user_name` ON `exercises` (`user_id`,`name`);--> statement-breakpoint
CREATE INDEX `idx_plan_exercises_plan` ON `plan_exercises` (`plan_id`,`order`);--> statement-breakpoint
CREATE INDEX `idx_session_sets_session` ON `session_sets` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_session_sets_exercise_completed` ON `session_sets` (`exercise_id`,`completed_at`);--> statement-breakpoint
CREATE INDEX `idx_sessions_user_started` ON `sessions` (`user_id`,`started_at`);--> statement-breakpoint
CREATE INDEX `idx_xp_events_user_created` ON `xp_events` (`user_id`,`created_at`);
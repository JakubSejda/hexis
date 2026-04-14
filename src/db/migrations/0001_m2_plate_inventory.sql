CREATE TABLE `plate_inventories` (
	`user_id` varchar(26) NOT NULL,
	`bar_kg` decimal(4,1) NOT NULL DEFAULT '20',
	`plates` json NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plate_inventories_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_user_finished` ON `sessions` (`user_id`,`finished_at`);
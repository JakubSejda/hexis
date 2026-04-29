CREATE TABLE `reward_redemptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(26) NOT NULL,
	`reward_id` int NOT NULL,
	`cost_xp` int NOT NULL,
	`note` varchar(280),
	`redeemed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reward_redemptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(26) NOT NULL,
	`name` varchar(80) NOT NULL,
	`cost_xp` int NOT NULL,
	`description` varchar(280),
	`archived_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_redemptions_user_redeemed` ON `reward_redemptions` (`user_id`,`redeemed_at`);--> statement-breakpoint
CREATE INDEX `idx_rewards_user_active` ON `rewards` (`user_id`,`archived_at`);
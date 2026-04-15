ALTER TABLE `measurements`
  ADD COLUMN `target_protein_g` smallint AFTER `target_kcal`,
  ADD COLUMN `target_carbs_g` smallint AFTER `target_protein_g`,
  ADD COLUMN `target_fat_g` smallint AFTER `target_carbs_g`,
  ADD COLUMN `target_sugar_g` smallint AFTER `target_fat_g`;
--> statement-breakpoint
ALTER TABLE `nutrition_days`
  ADD COLUMN `carbs_g` smallint AFTER `protein_g`,
  ADD COLUMN `fat_g` smallint AFTER `carbs_g`,
  ADD COLUMN `sugar_g` smallint AFTER `fat_g`;
--> statement-breakpoint
ALTER TABLE `users`
  ADD COLUMN `tracked_macros` json NOT NULL DEFAULT (JSON_ARRAY('kcal', 'protein'));
--> statement-breakpoint
CREATE INDEX `idx_measurements_user_week` ON `measurements` (`user_id`, `week_start` DESC);
--> statement-breakpoint
CREATE INDEX `idx_nutrition_user_date` ON `nutrition_days` (`user_id`, `date` DESC);

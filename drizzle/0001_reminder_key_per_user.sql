DROP INDEX "reminders_delivery_key_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "reminders_user_delivery_key_idx" ON "reminders" USING btree ("user_id","delivery_key");
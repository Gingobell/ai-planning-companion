CREATE TABLE "fixed_commitments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"version" integer NOT NULL,
	"title" text,
	"start" timestamp with time zone NOT NULL,
	"end" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"horizon" text NOT NULL,
	"deadline_at" timestamp with time zone,
	"deadline_source" text,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"version" integer NOT NULL,
	"chat_date" date NOT NULL,
	"role" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "open_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"version" integer NOT NULL,
	"task_id" text,
	"question" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"version" integer NOT NULL,
	"description" text NOT NULL,
	"scope" text NOT NULL,
	"preferred_window" jsonb,
	"status" text NOT NULL,
	"source" text NOT NULL,
	"superseded_by" text
);
--> statement-breakpoint
CREATE TABLE "progress_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"version" integer NOT NULL,
	"task_id" text NOT NULL,
	"kind" text NOT NULL,
	"note" text NOT NULL,
	"reported_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"version" integer NOT NULL,
	"kind" text NOT NULL,
	"task_id" text,
	"time_block_id" text,
	"scheduled_for" timestamp with time zone NOT NULL,
	"status" text NOT NULL,
	"delivery_key" text NOT NULL,
	"answered_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"goal_id" text,
	"parent_task_id" text,
	"deadline_at" timestamp with time zone,
	"deadline_source" text,
	"priority" text NOT NULL,
	"estimated_minutes" integer,
	"estimate_source" text,
	"status" text NOT NULL,
	"reminders_enabled" boolean NOT NULL,
	"acceptance" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "temporary_contexts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"version" integer NOT NULL,
	"description" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"version" integer NOT NULL,
	"task_id" text NOT NULL,
	"start" timestamp with time zone NOT NULL,
	"end" timestamp with time zone NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"version" integer NOT NULL,
	"time_zone" text NOT NULL,
	"availability" jsonb NOT NULL,
	"check_in_times" jsonb NOT NULL,
	"quiet_hours" jsonb,
	"reminders_pause" jsonb
);
--> statement-breakpoint
ALTER TABLE "fixed_commitments" ADD CONSTRAINT "fixed_commitments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "open_questions" ADD CONSTRAINT "open_questions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_reports" ADD CONSTRAINT "progress_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temporary_contexts" ADD CONSTRAINT "temporary_contexts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_blocks" ADD CONSTRAINT "time_blocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fixed_commitments_user_start_idx" ON "fixed_commitments" USING btree ("user_id","start");--> statement-breakpoint
CREATE INDEX "goals_user_idx" ON "goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "messages_user_chat_date_idx" ON "messages" USING btree ("user_id","chat_date");--> statement-breakpoint
CREATE INDEX "open_questions_user_idx" ON "open_questions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "preferences_user_idx" ON "preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "progress_reports_user_task_idx" ON "progress_reports" USING btree ("user_id","task_id");--> statement-breakpoint
CREATE INDEX "reminders_user_scheduled_idx" ON "reminders" USING btree ("user_id","scheduled_for");--> statement-breakpoint
CREATE INDEX "reminders_status_scheduled_idx" ON "reminders" USING btree ("status","scheduled_for");--> statement-breakpoint
CREATE UNIQUE INDEX "reminders_delivery_key_idx" ON "reminders" USING btree ("delivery_key");--> statement-breakpoint
CREATE INDEX "tasks_user_idx" ON "tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_user_goal_idx" ON "tasks" USING btree ("user_id","goal_id");--> statement-breakpoint
CREATE INDEX "temporary_contexts_user_idx" ON "temporary_contexts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "time_blocks_user_start_idx" ON "time_blocks" USING btree ("user_id","start");
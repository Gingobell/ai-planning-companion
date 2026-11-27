-- Questions saved before topics existed were all deadline questions; the default fills them, then goes away.
ALTER TABLE "open_questions" ADD COLUMN "topic" text NOT NULL DEFAULT 'deadline';--> statement-breakpoint
ALTER TABLE "open_questions" ALTER COLUMN "topic" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "open_questions" ADD COLUMN "proposed_deadline" timestamp with time zone;

CREATE TYPE "public"."candidate_status" AS ENUM('active', 'inactive', 'hired', 'rejected', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."experience_level" AS ENUM('entry', 'junior', 'mid', 'senior', 'lead', 'principal', 'executive');--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"current_title" text,
	"current_company" text,
	"experience_level" "experience_level" DEFAULT 'mid',
	"years_of_experience" integer,
	"expected_salary" integer,
	"currency" text DEFAULT 'USD',
	"location" text,
	"is_remote_ok" boolean DEFAULT false,
	"is_willing_to_relocate" boolean DEFAULT false,
	"resume_url" text,
	"portfolio_url" text,
	"linkedin_url" text,
	"github_url" text,
	"skills" jsonb,
	"summary" text,
	"notes" text,
	"resume_embedding" vector(1536),
	"skills_embedding" vector(1536),
	"summary_embedding" vector(1536),
	"status" "candidate_status" DEFAULT 'active' NOT NULL,
	"source" text,
	"available_from" timestamp,
	"notice_period" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "candidates_resume_embedding_idx" ON "candidates" USING hnsw ("resume_embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "candidates_skills_embedding_idx" ON "candidates" USING hnsw ("skills_embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "candidates_summary_embedding_idx" ON "candidates" USING hnsw ("summary_embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "candidates_email_idx" ON "candidates" USING btree ("email");--> statement-breakpoint
CREATE INDEX "candidates_status_idx" ON "candidates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "candidates_experience_level_idx" ON "candidates" USING btree ("experience_level");--> statement-breakpoint
CREATE INDEX "candidates_location_idx" ON "candidates" USING btree ("location");--> statement-breakpoint
CREATE INDEX "candidates_created_at_idx" ON "candidates" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "candidates_active_status_idx" ON "candidates" USING btree ("status","is_deleted") WHERE "candidates"."is_deleted" = false;
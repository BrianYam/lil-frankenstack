CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'EDITOR', 'USER');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'USER' NOT NULL;
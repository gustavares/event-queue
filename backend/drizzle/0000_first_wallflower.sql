CREATE TYPE "public"."check_in_status" AS ENUM('PENDING', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('MANAGER', 'PROMOTER', 'HOST');--> statement-breakpoint
CREATE TABLE "user" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);

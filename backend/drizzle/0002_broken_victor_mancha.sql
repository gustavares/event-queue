CREATE TYPE "public"."event_source" AS ENUM('FIRST_PARTY', 'CURATED');--> statement-breakpoint
CREATE TYPE "public"."event_visibility" AS ENUM('PUBLIC', 'UNLISTED');--> statement-breakpoint
CREATE TABLE "artist" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"external_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artist_name_key_unique" UNIQUE("name_key")
);
--> statement-breakpoint
CREATE TABLE "city" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"state" varchar(2) NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "city_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "event_artist" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"event_id" varchar(24) NOT NULL,
	"artist_id" varchar(24) NOT NULL,
	"position" integer NOT NULL,
	"is_headliner" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_genre" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"event_id" varchar(24) NOT NULL,
	"genre_id" varchar(24) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "genre" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "genre_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "subscriber" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"city_id" varchar(24) NOT NULL,
	"unsubscribe_token" text NOT NULL,
	"consented_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriber_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "visibility" "event_visibility" DEFAULT 'UNLISTED' NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "source" "event_source" DEFAULT 'FIRST_PARTY' NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "city_id" varchar(24);--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "external_ticket_url" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "curator_note" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "featured_from" timestamp;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "featured_until" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_curator" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "venue" ADD COLUMN "city_id" varchar(24);--> statement-breakpoint
ALTER TABLE "event_artist" ADD CONSTRAINT "event_artist_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_artist" ADD CONSTRAINT "event_artist_artist_id_artist_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artist"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_genre" ADD CONSTRAINT "event_genre_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_genre" ADD CONSTRAINT "event_genre_genre_id_genre_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genre"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriber" ADD CONSTRAINT "subscriber_city_id_city_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."city"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_event_artist_idx" ON "event_artist" USING btree ("event_id","artist_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_event_genre_idx" ON "event_genre" USING btree ("event_id","genre_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_email_city_idx" ON "subscriber" USING btree ("email","city_id");--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_city_id_city_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."city"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue" ADD CONSTRAINT "venue_city_id_city_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."city"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_source_url_unique" UNIQUE("source_url");
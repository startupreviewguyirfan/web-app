CREATE TABLE "startups" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text NOT NULL,
	"description" text NOT NULL,
	"logo_url" text,
	"youtube_video_id" text NOT NULL,
	"category" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"website_url" text,
	"twitter_url" text,
	"linkedin_url" text,
	"funding_stage" text,
	"total_raised" text,
	"notable_investors" text,
	"last_round_date" text,
	"revenue_arr" text,
	"revenue_estimated" boolean DEFAULT false NOT NULL,
	"competitors" text,
	"use_case" text,
	"verdict" text,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	CONSTRAINT "startups_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "founders" (
	"id" text PRIMARY KEY NOT NULL,
	"startup_id" text NOT NULL,
	"name" text NOT NULL,
	"role" text,
	"linkedin_url" text,
	"photo_url" text
);
--> statement-breakpoint
CREATE TABLE "partner_inquiries" (
	"id" text PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"website" text,
	"message" text NOT NULL,
	"budget_range" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'new' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "founders" ADD CONSTRAINT "founders_startup_id_startups_id_fk" FOREIGN KEY ("startup_id") REFERENCES "public"."startups"("id") ON DELETE cascade ON UPDATE no action;
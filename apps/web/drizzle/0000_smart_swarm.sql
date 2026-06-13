DO $$ BEGIN
 CREATE TYPE "public"."lead_status" AS ENUM('active', 'contacted', 'interested', 'quotation_sent', 'client', 'rejected', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."scan_job_status" AS ENUM('running', 'completed', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"file_key" text NOT NULL,
	"file_name" text NOT NULL,
	"mime" text,
	"size" integer,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "business_scan_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"rating" numeric(2, 1)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"address" text,
	"city" text,
	"state" text,
	"country" text,
	"lat" double precision,
	"lng" double precision,
	"phone" text,
	"email" text,
	"website" text,
	"has_website" boolean DEFAULT false NOT NULL,
	"rating" numeric(2, 1),
	"review_count" integer DEFAULT 0 NOT NULL,
	"price_level" text,
	"hours" jsonb,
	"socials" jsonb,
	"google_url" text,
	"opportunity_score" integer DEFAULT 0 NOT NULL,
	"status" "lead_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_scanned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "filter_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"filters" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scan_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query" text NOT NULL,
	"category" text,
	"area" text,
	"source" text DEFAULT 'extension' NOT NULL,
	"status" "scan_job_status" DEFAULT 'running' NOT NULL,
	"found_count" integer DEFAULT 0 NOT NULL,
	"new_count" integer DEFAULT 0 NOT NULL,
	"updated_count" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attachments" ADD CONSTRAINT "attachments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "business_scan_history" ADD CONSTRAINT "business_scan_history_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attachments_business_idx" ON "attachments" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scan_history_business_idx" ON "business_scan_history" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "businesses_place_id_unique" ON "businesses" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "businesses_city_idx" ON "businesses" USING btree ("city");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "businesses_category_idx" ON "businesses" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "businesses_status_idx" ON "businesses" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "businesses_review_count_idx" ON "businesses" USING btree ("review_count");
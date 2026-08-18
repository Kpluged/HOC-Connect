CREATE TABLE "app"."audit_logs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "app"."audit_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"organization_id" uuid NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"before_data" jsonb,
	"after_data" jsonb,
	"request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app"."drivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"profile_id" uuid,
	"display_name" text NOT NULL,
	"phone" text,
	"prembly_reference" text,
	"prembly_status" text,
	"licence_reference" text,
	"status" "app"."membership_status" DEFAULT 'invited' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "drivers_display_name_not_blank" CHECK (char_length(btrim("app"."drivers"."display_name")) > 0)
);
--> statement-breakpoint
ALTER TABLE "app"."drivers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app"."shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"trip_count" integer DEFAULT 0 NOT NULL,
	"gross_revenue_minor" bigint DEFAULT 0 NOT NULL,
	"currency" text,
	"created_by_user_id" uuid NOT NULL,
	"ended_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shifts_trip_count_non_negative" CHECK ("app"."shifts"."trip_count" >= 0),
	CONSTRAINT "shifts_gross_revenue_non_negative" CHECK ("app"."shifts"."gross_revenue_minor" >= 0),
	CONSTRAINT "shifts_currency_format" CHECK ("app"."shifts"."currency" is null or char_length("app"."shifts"."currency") = 3),
	CONSTRAINT "shifts_ended_after_started" CHECK ("app"."shifts"."ended_at" is null or "app"."shifts"."ended_at" > "app"."shifts"."started_at")
);
--> statement-breakpoint
ALTER TABLE "app"."shifts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "app"."audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "app"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."drivers" ADD CONSTRAINT "drivers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "app"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."drivers" ADD CONSTRAINT "drivers_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."drivers" ADD CONSTRAINT "drivers_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."shifts" ADD CONSTRAINT "shifts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "app"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."shifts" ADD CONSTRAINT "shifts_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "app"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."shifts" ADD CONSTRAINT "shifts_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "app"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."shifts" ADD CONSTRAINT "shifts_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."shifts" ADD CONSTRAINT "shifts_ended_by_user_id_users_id_fk" FOREIGN KEY ("ended_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "drivers_org_profile_idx" ON "app"."drivers" USING btree ("organization_id","profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shifts_active_driver_idx" ON "app"."shifts" USING btree ("driver_id") WHERE "app"."shifts"."ended_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "shifts_active_vehicle_idx" ON "app"."shifts" USING btree ("vehicle_id") WHERE "app"."shifts"."ended_at" is null;

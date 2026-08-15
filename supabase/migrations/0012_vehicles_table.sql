CREATE TYPE "app"."vehicle_lifecycle_status" AS ENUM('allocated', 'delivered', 'active');--> statement-breakpoint
CREATE TABLE "app"."vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"vehicle_model_slug" text NOT NULL,
	"vin" text NOT NULL,
	"plate" text,
	"status" "app"."vehicle_lifecycle_status" DEFAULT 'allocated' NOT NULL,
	"allocated_by_user_id" uuid NOT NULL,
	"allocated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_vin_not_blank" CHECK (char_length(btrim("app"."vehicles"."vin")) > 0)
);
--> statement-breakpoint
ALTER TABLE "app"."vehicles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "app"."vehicles" ADD CONSTRAINT "vehicles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "app"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."vehicles" ADD CONSTRAINT "vehicles_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "app"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."vehicles" ADD CONSTRAINT "vehicles_allocated_by_user_id_users_id_fk" FOREIGN KEY ("allocated_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_vin_idx" ON "app"."vehicles" USING btree ("vin");

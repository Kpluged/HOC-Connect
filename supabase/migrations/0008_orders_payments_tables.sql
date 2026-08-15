CREATE TYPE "app"."order_status" AS ENUM('draft', 'deposit_pending', 'deposit_paid', 'balance_pending', 'paid_in_full', 'cancelled');
CREATE TYPE "app"."payment_kind" AS ENUM('deposit', 'balance');
CREATE TYPE "app"."payment_status" AS ENUM('pending', 'succeeded', 'failed');
CREATE TABLE "app"."orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"status" "app"."order_status" DEFAULT 'draft' NOT NULL,
	"total_minor" bigint NOT NULL,
	"deposit_minor" bigint NOT NULL,
	"currency" text NOT NULL,
	"pricing_note" text,
	"created_by_user_id" uuid NOT NULL,
	"terms_accepted_at" timestamp with time zone,
	"terms_accepted_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_total_non_negative" CHECK ("app"."orders"."total_minor" >= 0),
	CONSTRAINT "orders_deposit_within_total" CHECK ("app"."orders"."deposit_minor" >= 0 and "app"."orders"."deposit_minor" <= "app"."orders"."total_minor"),
	CONSTRAINT "orders_currency_format" CHECK (char_length("app"."orders"."currency") = 3)
);
ALTER TABLE "app"."orders" ENABLE ROW LEVEL SECURITY;
CREATE TABLE "app"."payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"kind" "app"."payment_kind" NOT NULL,
	"status" "app"."payment_status" DEFAULT 'pending' NOT NULL,
	"amount_minor" bigint NOT NULL,
	"currency" text NOT NULL,
	"provider_reference" text NOT NULL,
	"provider_transaction_id" text,
	"provider_metadata" jsonb,
	"initiated_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amount_non_negative" CHECK ("app"."payments"."amount_minor" >= 0),
	CONSTRAINT "payments_currency_format" CHECK (char_length("app"."payments"."currency") = 3)
);
ALTER TABLE "app"."payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "app"."orders" ADD CONSTRAINT "orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "app"."organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "app"."orders" ADD CONSTRAINT "orders_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "app"."applications"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "app"."orders" ADD CONSTRAINT "orders_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "app"."orders" ADD CONSTRAINT "orders_terms_accepted_by_user_id_users_id_fk" FOREIGN KEY ("terms_accepted_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "app"."payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "app"."orders"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "app"."payments" ADD CONSTRAINT "payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "app"."organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "app"."payments" ADD CONSTRAINT "payments_initiated_by_user_id_users_id_fk" FOREIGN KEY ("initiated_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;
CREATE UNIQUE INDEX "orders_active_application_idx" ON "app"."orders" USING btree ("application_id") WHERE "app"."orders"."status" <> 'cancelled';
CREATE UNIQUE INDEX "payments_provider_reference_idx" ON "app"."payments" USING btree ("provider_reference");
CREATE UNIQUE INDEX "payments_succeeded_order_kind_idx" ON "app"."payments" USING btree ("order_id","kind") WHERE "app"."payments"."status" = 'succeeded';

CREATE POLICY "creator can insert own owner membership" ON "app"."organization_memberships" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
          "app"."organization_memberships"."user_id" = (select auth.uid())
          and "app"."organization_memberships"."role" = 'owner'
          and exists (
            select 1 from "app"."organizations" o
            where o.id = "app"."organization_memberships"."organization_id" and o.created_by = (select auth.uid())
          )
        );--> statement-breakpoint
ALTER POLICY "uploader can insert application documents" ON "app"."application_documents" TO authenticated WITH CHECK ("app"."application_documents"."uploaded_by" = (select auth.uid()) and (select private.can_view_org("app"."application_documents"."organization_id")));--> statement-breakpoint
ALTER POLICY "applicants can insert own applications" ON "app"."applications" TO authenticated WITH CHECK ("app"."applications"."applicant_user_id" = (select auth.uid()) and (select private.can_view_org("app"."applications"."organization_id")));
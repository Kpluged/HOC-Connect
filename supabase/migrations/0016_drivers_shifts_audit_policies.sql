CREATE POLICY "staff can select audit logs" ON "app"."audit_logs" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select private.is_hoc_staff()));--> statement-breakpoint
CREATE POLICY "actor can insert their own audit log entries" ON "app"."audit_logs" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("app"."audit_logs"."actor_user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "managers and staff see all tenant drivers, driver sees own row" ON "app"."drivers" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select private.is_hoc_staff()) or (select private.has_org_role("app"."drivers"."organization_id", array['owner','dispatcher']::text[])) or "app"."drivers"."profile_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "managers and staff can insert drivers" ON "app"."drivers" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select private.is_hoc_staff()) or (select private.has_org_role("app"."drivers"."organization_id", array['owner','dispatcher']::text[])));--> statement-breakpoint
CREATE POLICY "managers and staff can update drivers" ON "app"."drivers" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select private.is_hoc_staff()) or (select private.has_org_role("app"."drivers"."organization_id", array['owner','dispatcher']::text[]))) WITH CHECK ((select private.is_hoc_staff()) or (select private.has_org_role("app"."drivers"."organization_id", array['owner','dispatcher']::text[])));--> statement-breakpoint
CREATE POLICY "managers, staff, and the assigned driver can select shifts" ON "app"."shifts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select private.is_hoc_staff()) or (select private.has_org_role("app"."shifts"."organization_id", array['owner','dispatcher']::text[])) or exists (
          select 1 from "app"."drivers" d
          where d.id = "app"."shifts"."driver_id" and d.profile_id = (select auth.uid())
        ));--> statement-breakpoint
CREATE POLICY "managers and staff can insert shifts for eligible drivers and vehicles" ON "app"."shifts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((select private.is_hoc_staff()) or (select private.has_org_role("app"."shifts"."organization_id", array['owner','dispatcher']::text[])))
          and exists (
            select 1 from "app"."drivers" d
            where d.id = "app"."shifts"."driver_id" and d.organization_id = "app"."shifts"."organization_id"
          )
          and exists (
            select 1 from "app"."vehicles" v
            where v.id = "app"."shifts"."vehicle_id"
              and v.organization_id = "app"."shifts"."organization_id"
              and v.status in ('delivered', 'active')
          ));--> statement-breakpoint
CREATE POLICY "managers and staff can update shifts" ON "app"."shifts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select private.is_hoc_staff()) or (select private.has_org_role("app"."shifts"."organization_id", array['owner','dispatcher']::text[]))) WITH CHECK ((select private.is_hoc_staff()) or (select private.has_org_role("app"."shifts"."organization_id", array['owner','dispatcher']::text[])));

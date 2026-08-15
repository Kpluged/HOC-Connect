CREATE POLICY "tenant and staff can select vehicles" ON "app"."vehicles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select private.can_view_org("app"."vehicles"."organization_id")));--> statement-breakpoint
CREATE POLICY "staff can insert vehicles for paid orders" ON "app"."vehicles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select private.is_hoc_staff()) and exists (
          select 1 from "app"."orders" o
          where o.id = "app"."vehicles"."order_id" and o.status = 'paid_in_full'
        ));--> statement-breakpoint
CREATE POLICY "staff can update vehicles" ON "app"."vehicles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select private.is_hoc_staff())) WITH CHECK ((select private.is_hoc_staff()));

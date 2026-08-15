-- Hand-authored. Caught live in the Milestone 6 RLS smoke test: the original
-- "owner or staff can insert payment attempts" policy's WITH CHECK only
-- verified who was inserting, not what status they inserted - an owner
-- could insert a payments row already marked 'succeeded' directly via the
-- API, bypassing both the tRPC layer's hardcoded status and the webhook's
-- server-to-server Paystack verification entirely. RLS is the real
-- boundary (see docs/HOC-Connect-architecture-and-schema.md section 1), so
-- this closes the gap at that layer, not just in application code.

ALTER POLICY "owner or staff can insert payment attempts" ON "app"."payments" WITH CHECK (((select private.is_hoc_staff()) or (select private.has_org_role("app"."payments"."organization_id", array['owner']::text[]))) AND "app"."payments"."status" = 'pending');

-- Driver profile photos. Additive column + a private Storage bucket mirroring
-- the kyc-documents pattern (0004): no public URLs, reads go through
-- createSignedUrl. Objects are stored at `<organization-id>/<driver-id>` so the
-- first path segment is the org the photo belongs to, and RLS authorizes on it.

alter table app.drivers add column if not exists photo_path text;
--> statement-breakpoint

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('driver-photos', 'driver-photos', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
--> statement-breakpoint

-- Managers (owner/dispatcher) of the photo's org, and HOC staff, may write it.
create policy "managers and staff insert driver photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'driver-photos'
  and (
    (select private.is_hoc_staff())
    or (select private.has_org_role((storage.foldername(name))[1]::uuid, array['owner','dispatcher']::text[]))
  )
);
--> statement-breakpoint
create policy "managers and staff update driver photos"
on storage.objects for update to authenticated
using (
  bucket_id = 'driver-photos'
  and (
    (select private.is_hoc_staff())
    or (select private.has_org_role((storage.foldername(name))[1]::uuid, array['owner','dispatcher']::text[]))
  )
)
with check (
  bucket_id = 'driver-photos'
  and (
    (select private.is_hoc_staff())
    or (select private.has_org_role((storage.foldername(name))[1]::uuid, array['owner','dispatcher']::text[]))
  )
);
--> statement-breakpoint
create policy "managers and staff read driver photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'driver-photos'
  and (
    (select private.is_hoc_staff())
    or (select private.has_org_role((storage.foldername(name))[1]::uuid, array['owner','dispatcher']::text[]))
  )
);
--> statement-breakpoint
create policy "managers and staff delete driver photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'driver-photos'
  and (
    (select private.is_hoc_staff())
    or (select private.has_org_role((storage.foldername(name))[1]::uuid, array['owner','dispatcher']::text[]))
  )
);

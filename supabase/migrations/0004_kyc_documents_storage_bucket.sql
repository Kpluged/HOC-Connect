-- Hand-authored. Private bucket for KYC documents, scoped to
-- <user-id>/<application-id>/... via storage.foldername(name). No public
-- URLs - reads always go through createSignedUrl. Must apply after
-- 0000_private_rls_helpers.sql (references private.is_hoc_staff()).

insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;

create policy "applicants can upload own kyc documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'kyc-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "applicants and staff can read kyc documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'kyc-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.is_hoc_staff())
  )
);

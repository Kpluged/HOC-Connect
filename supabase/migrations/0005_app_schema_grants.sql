-- Hand-authored. RLS policies control row visibility, but the authenticated
-- role still needs baseline schema/table privileges before Postgres will
-- even attempt a query - these were missing (caught during Milestone 5's
-- RLS smoke test: "permission denied for schema app").

grant usage on schema app to authenticated;

grant select, update on app.profiles to authenticated;
grant select on app.platform_roles to authenticated;
grant select, insert, update on app.organizations to authenticated;
grant select, insert, update, delete on app.organization_memberships to authenticated;
grant select, insert, update on app.applications to authenticated;
grant select, insert, update on app.application_documents to authenticated;
-- Append-only: no update/delete grant.
grant select, insert on app.application_notes to authenticated;

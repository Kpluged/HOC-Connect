# Staff bootstrap

Milestone 5 has no self-service invite flow. The first (and any
subsequent) HOC staff account is granted manually, once the person has
signed in at least once through the normal `/auth/sign-in` flow (so a row
exists in `auth.users`).

```sql
insert into app.platform_roles (user_id, role, status)
values (
  (select id from auth.users where email = '<staff-email>'),
  'hoc_admin',
  'active'
);
```

Run this against the project's Postgres database (e.g. via the Supabase
SQL editor, or `execute_sql` through the Supabase MCP tools). `role` can
be `hoc_staff` or `hoc_admin` - both currently unlock `/admin/applications`
identically; the distinction exists in the schema for future use.

To revoke access, update the row's `status` to `revoked` rather than
deleting it (keeps an audit trail):

```sql
update app.platform_roles
set status = 'revoked'
where user_id = (select id from auth.users where email = '<staff-email>');
```

-- Hand-authored. Creates the app.profiles row atomically with signup -
-- Supabase's standard auth.users trigger pattern, not application code.
-- Must apply after 0001_app_tables.sql (app.profiles must exist).

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into app.profiles (id)
  values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();

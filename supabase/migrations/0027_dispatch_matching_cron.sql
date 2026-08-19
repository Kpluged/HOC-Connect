-- Milestone 9b: run the automated matcher on a schedule. Cadence is tunable;
-- managers still assign manually within the 25s grace window in
-- app.run_dispatch_matching() before auto-dispatch takes over.
create extension if not exists pg_cron;
--> statement-breakpoint
select cron.schedule('hoc-dispatch-matching', '20 seconds', $$select app.run_dispatch_matching();$$);

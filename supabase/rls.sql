-- Enable RLS
alter table profiles enable row level security;
alter table user_settings enable row level security;
alter table activity_log enable row level security;
alter table job_searches enable row level security;
alter table job_results enable row level security;
alter table competitor_reports enable row level security;
alter table travel_plans enable row level security;
alter table usage_events enable row level security;
alter table billing_profile enable row level security;
alter table billing_invoices enable row level security;
alter table api_keys enable row level security;
alter table jobs enable row level security;
alter table job_runs enable row level security;
alter table job_outputs enable row level security;
alter table apify_runs enable row level security;

-- Profiles
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

-- Generic per-user policies
create policy "user_settings_rw" on user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "activity_log_rw" on activity_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "job_searches_rw" on job_searches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "job_results_rw" on job_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "competitor_reports_rw" on competitor_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "travel_plans_rw" on travel_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "usage_events_rw" on usage_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "billing_profile_rw" on billing_profile
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "billing_invoices_rw" on billing_invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "api_keys_rw" on api_keys
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "jobs_rw" on jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "job_runs_rw" on job_runs
  for all using (
    auth.uid() = (select user_id from jobs where jobs.id = job_runs.job_id)
  ) with check (
    auth.uid() = (select user_id from jobs where jobs.id = job_runs.job_id)
  );
create policy "job_outputs_rw" on job_outputs
  for all using (
    auth.uid() = (select user_id from jobs where jobs.id = job_outputs.job_id)
  ) with check (
    auth.uid() = (select user_id from jobs where jobs.id = job_outputs.job_id)
  );
create policy "apify_runs_rw" on apify_runs
  for all using (
    auth.uid() = (select user_id from jobs where jobs.id = apify_runs.job_id)
  ) with check (
    auth.uid() = (select user_id from jobs where jobs.id = apify_runs.job_id)
  );

-- Storage policies for resumes bucket
create policy "resumes_read_own" on storage.objects
  for select using (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "resumes_write_own" on storage.objects
  for insert with check (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "inputs_read_own" on storage.objects
  for select using (
    bucket_id = 'inputs' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "inputs_write_own" on storage.objects
  for insert with check (
    bucket_id = 'inputs' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "outputs_read_own" on storage.objects
  for select using (
    bucket_id = 'outputs' and auth.uid()::text = (storage.foldername(name))[1]
  );

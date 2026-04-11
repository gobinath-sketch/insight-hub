do $$
begin
  alter publication supabase_realtime add table profiles;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table user_settings;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table activity_log;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table job_searches;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table job_results;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table competitor_reports;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table travel_plans;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table usage_events;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table billing_profile;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table billing_invoices;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table api_keys;
exception when duplicate_object then null;
end $$;

-- Core tables
create extension if not exists "uuid-ossp";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  notifications jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists activity_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  type text,
  title text,
  created_at timestamptz default now()
);

create table if not exists job_searches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  role text,
  location text,
  work_type text,
  min_salary text,
  resume_path text,
  created_at timestamptz default now()
);

create table if not exists job_results (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  search_id uuid references job_searches(id) on delete cascade,
  title text,
  company text,
  location text,
  salary text,
  match_score int,
  source text,
  remote boolean,
  missing_skills text[],
  why_fit text,
  posted text,
  created_at timestamptz default now()
);

create table if not exists competitor_reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text,
  url text,
  swot jsonb,
  pricing jsonb,
  signals text[],
  positioning text,
  direction text,
  created_at timestamptz default now()
);

create table if not exists travel_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  destination text,
  dates text,
  budget text,
  travelers text,
  travel_style text,
  pace text,
  interests text,
  itinerary jsonb,
  budget_breakdown jsonb,
  packing_list text[],
  created_at timestamptz default now()
);

create table if not exists usage_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  event_type text,
  credits_used int default 0,
  created_at timestamptz default now()
);

create table if not exists billing_profile (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  plan_name text,
  status text,
  renewal_date text,
  price text,
  credits_used int,
  credits_limit int,
  reports_saved int,
  team_members int,
  team_limit int,
  card_last4 text,
  card_expiry text,
  created_at timestamptz default now()
);

create table if not exists billing_invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  date text,
  amount text,
  status text,
  created_at timestamptz default now()
);

create table if not exists api_keys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text,
  key_value text,
  status text,
  last_used_at timestamptz,
  created_at timestamptz default now()
);

-- HandyScrapper jobs
create table if not exists jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  type text,
  status text,
  input_json jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists job_runs (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references jobs(id) on delete cascade,
  stage text,
  logs text,
  error text,
  started_at timestamptz default now(),
  finished_at timestamptz
);

create table if not exists job_outputs (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references jobs(id) on delete cascade,
  type text,
  storage_path text,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists apify_runs (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references jobs(id) on delete cascade,
  actor_id text,
  dataset_id text,
  stats jsonb,
  created_at timestamptz default now()
);

-- Storage buckets
insert into storage.buckets (id, name, public)
values ('inputs', 'inputs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('outputs', 'outputs', false)
on conflict (id) do nothing;

-- Storage bucket for resumes
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

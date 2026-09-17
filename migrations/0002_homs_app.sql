-- HOMS app schema (multi-tenant).
-- user_id is TEXT (matches Better Auth "user".id and the preview 'dev-user').
-- Always filter by user_id on the server. Never trust a client-supplied owner id.

-- Plan catalog (shared reference data; not per-user)
create table if not exists plans (
  id text primary key,
  name text not null,
  price_try integer not null default 0,
  duration_days integer not null,
  terms text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into plans (id, name, price_try, duration_days, terms)
values
  ('trial', '3 gün ücretsiz', 0, 3, 'Kart gerekmez. Süre bitince üyelik gerekir.'),
  ('aylik', 'Aylık', 1490, 30, 'İptal her an. Dönem sonuna kadar erişim.'),
  ('yillik', 'Yıllık', 12900, 365, 'Yıllık peşin. 2 ay hediye hesabı.')
on conflict (id) do nothing;

-- Per-user membership / subscription state
create table if not exists memberships (
  user_id text primary key,
  plan_id text not null references plans (id),
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memberships_plan_idx on memberships (plan_id);
create index if not exists memberships_ends_at_idx on memberships (ends_at);

-- Studio projects
create table if not exists projects (
  id text primary key,
  user_id text not null,
  title text not null,
  mode text not null default 'furnish',
  style text not null default 'warm',
  view text not null default 'living',
  brief text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on projects (user_id);
create index if not exists projects_updated_at_idx on projects (user_id, updated_at desc);

-- Source images + generated assets attached to a project
create table if not exists project_assets (
  id text primary key,
  project_id text not null references projects (id) on delete cascade,
  user_id text not null,
  kind text not null,
  role text,
  url text not null,
  storage_key text,
  prompt text not null default '',
  view text,
  title text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists project_assets_project_idx on project_assets (project_id);
create index if not exists project_assets_user_idx on project_assets (user_id);

-- Chat / conversation turns inside a project
create table if not exists conversation_turns (
  id text primary key,
  project_id text not null references projects (id) on delete cascade,
  user_id text not null,
  role text not null,
  text text not null default '',
  kind text,
  url text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists conversation_turns_project_idx on conversation_turns (project_id, created_at);
create index if not exists conversation_turns_user_idx on conversation_turns (user_id);

-- AI generation jobs (image / video / interpret)
create table if not exists ai_jobs (
  id text primary key,
  user_id text not null,
  project_id text,
  type text not null,
  provider text not null default 'xai',
  status text not null default 'pending',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text,
  external_id text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists ai_jobs_user_idx on ai_jobs (user_id, created_at desc);
create index if not exists ai_jobs_project_idx on ai_jobs (project_id);
create index if not exists ai_jobs_external_idx on ai_jobs (external_id);

-- Usage events (Stripe-ready metering; no billing in Stage-2)
create table if not exists usage_events (
  id text primary key,
  user_id text not null,
  plan_id text,
  operation text not null,
  units integer not null default 1,
  provider text,
  job_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_idx on usage_events (user_id, created_at desc);
create index if not exists usage_events_operation_idx on usage_events (operation);

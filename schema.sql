create table if not exists app_state (
  id integer primary key check (id = 1),
  data jsonb not null default '{"debts":[],"shifts":[],"scheduleConfig":{}}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Resumen del día: un registro por niño por día.
create table public.daily_summaries (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  date date not null,
  meals_count int not null default 0,
  sleep_minutes int not null default 0,
  activities_count int not null default 0,
  mood text,
  highlight text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id, date)
);

-- Tokens de dispositivos para notificaciones push (opcional).
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  token text not null,
  platform text not null,
  created_at timestamptz not null default now()
);

-- FK que Postgres no indexa solo.
create index daily_summaries_child_id_idx on public.daily_summaries (child_id);
create index devices_user_id_idx on public.devices (user_id);

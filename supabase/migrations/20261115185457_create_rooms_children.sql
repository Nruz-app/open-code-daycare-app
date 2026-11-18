-- Salas de la guardería (Soles, etc.).
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id),
  name text not null,
  created_at timestamptz not null default now()
);

-- Niños inscritos en la guardería.
create table public.children (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms (id),
  full_name text not null,
  birth_date date not null,
  enrolled_at date not null,
  medical_notes text,
  allergy_tags text[] not null default '{}',
  photo_consent boolean not null default true,
  status public.child_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- FK que Postgres no indexa solo.
create index rooms_daycare_id_idx on public.rooms (daycare_id);
create index children_room_id_idx on public.children (room_id);

-- Reacciones de los padres a publicaciones: una reacción por usuario.
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- Comentarios en publicaciones.
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- FK que Postgres no indexa solo.
create index reactions_post_id_idx on public.reactions (post_id);
create index reactions_user_id_idx on public.reactions (user_id);
create index comments_post_id_idx on public.comments (post_id);

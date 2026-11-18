-- Publicaciones del feed: pueden etiquetar varios niños o ser anuncios.
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users (id),
  room_id uuid references public.rooms (id),
  type public.post_type not null,
  title text,
  body text not null,
  published_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Niños etiquetados en la publicación (clave del feed del padre).
create table public.post_children (
  post_id uuid not null references public.posts (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  primary key (post_id, child_id)
);

-- Fotos adjuntas a la publicación.
create table public.post_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  url text not null,
  width int,
  height int,
  position int not null,
  created_at timestamptz not null default now()
);

-- FK que Postgres no indexa solo.
create index posts_author_id_idx on public.posts (author_id);
create index posts_room_id_idx on public.posts (room_id);
create index post_children_child_id_idx on public.post_children (child_id);
create index post_children_post_id_idx on public.post_children (post_id);
create index post_photos_post_id_idx on public.post_photos (post_id);

-- RLS habilitada en todas las tablas nuevas del DDL. Las políticas van
-- tabla por tabla en cada spec que las consume; el aviso INFO
-- rls_enabled_no_policy de las que aún no tienen políticas es esperado
-- (mismo estado que daycares desde SPEC 06).
alter table public.rooms enable row level security;
alter table public.children enable row level security;
alter table public.parent_children enable row level security;
alter table public.invitations enable row level security;
alter table public.posts enable row level security;
alter table public.post_children enable row level security;
alter table public.post_photos enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;
alter table public.daily_summaries enable row level security;
alter table public.devices enable row level security;

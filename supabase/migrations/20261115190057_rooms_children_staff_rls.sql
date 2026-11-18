-- El personal de una guardería solo accede a las salas de su centro.
create policy "rooms_staff_select"
  on public.rooms
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = (select auth.uid())
        and u.daycare_id = rooms.daycare_id
        and u.role in ('staff', 'admin')
    )
  );

create policy "rooms_staff_insert"
  on public.rooms
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.users u
      where u.id = (select auth.uid())
        and u.daycare_id = rooms.daycare_id
        and u.role in ('staff', 'admin')
    )
  );

-- Los niños se filtran por la guardería de su sala.
create policy "children_staff_select"
  on public.children
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.rooms r
      join public.users u on u.daycare_id = r.daycare_id
      where r.id = children.room_id
        and u.id = (select auth.uid())
        and u.role in ('staff', 'admin')
    )
  );

create policy "children_staff_insert"
  on public.children
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.rooms r
      join public.users u on u.daycare_id = r.daycare_id
      where r.id = children.room_id
        and u.id = (select auth.uid())
        and u.role in ('staff', 'admin')
    )
  );

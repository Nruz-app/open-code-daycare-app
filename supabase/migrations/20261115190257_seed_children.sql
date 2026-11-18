-- Los ocho niños del mock de SPEC 10 como filas reales de children:
-- birth_date literal del mock, enrolled_at el día 1 del mes de su ingreso,
-- allergy_tags de su chip (en inglés) y medical_notes de sus notas.
insert into public.children (room_id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, status)
select r.id, c.full_name, c.birth_date, c.enrolled_at, c.medical_notes, c.allergy_tags, 'active'::public.child_status
from public.rooms r
join (
  values
    ('Soles', 'Mateo Fernández', date '2022-03-12', date '2025-02-01',
      'Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.', array['peanut']::text[]),
    ('Soles', 'Sofía Méndez', date '2023-07-08', date '2025-03-01', null, array[]::text[]),
    ('Soles', 'Benjamín Ruiz', date '2022-01-22', date '2024-02-01', null, array[]::text[]),
    ('Soles', 'Valentina Soto', date '2023-11-03', date '2025-03-01', null, array[]::text[]),
    ('Soles', 'Tomás Díaz', date '2022-05-17', date '2025-02-01', null, array['lactose']::text[]),
    ('Soles', 'Emma Castro', date '2023-09-29', date '2025-03-01', null, array[]::text[]),
    ('Soles', 'Lucas Romero', date '2022-04-11', date '2025-01-01', null, array[]::text[]),
    ('Soles', 'Olivia Vega', date '2023-12-06', date '2025-03-01', null, array[]::text[])
) as c(room_name, full_name, birth_date, enrolled_at, medical_notes, allergy_tags)
  on c.room_name = r.name
where r.daycare_id = (
  select d.id
  from public.daycares d
  where d.name = 'Guardería Sala Soles'
);

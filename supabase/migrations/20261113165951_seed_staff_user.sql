-- Usuario staff demo. El insert en auth.users dispara on_auth_user_created,
-- que crea la fila de perfil en public.users con role=staff y la guardería demo.
-- Las columnas de tokens van con '' (no NULL) porque así las espera el servicio de Auth.
insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'staff@guarderia-demo.test',
  crypt('demo1234', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object(
    'daycare_id', (select id from public.daycares where name = 'Guardería Sala Soles'),
    'role', 'staff',
    'full_name', 'Ana Demo'
  ),
  now(), now(),
  '', '', '', ''
);

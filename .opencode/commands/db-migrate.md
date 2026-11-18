---
description: Sincroniza y aplica las migraciones de Supabase (agente db-migrator)
agent: db-migrator
model: opencode/nemotron-3.5-super-vl-free
---

Ejecuta tu flujo completo para la tarea `$ARGUMENTS`: inventaria `supabase/migrations/` contra
`tools.supabase.list_migrations()`, aplica las pendientes y, si la tarea es un cambio de esquema
nuevo, crea el archivo de migración con las convenciones del proyecto y aplícalo.

Si `$ARGUMENTS` está vacío, haz una auditoría: compara repo ↔ Supabase y reporta el estado sin
aplicar nada sin confirmación.

Responde en español.

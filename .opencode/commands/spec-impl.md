---
description: Implementa una spec aprobada (skill spec-impl)
---

Carga la skill con id `spec-impl` usando la herramienta `skill` y sigue sus fases en orden estricto.

Donde la skill muestre `$ARGUMENTS`, usa el argumento de este comando.

La skill asume un "contexto de sesión" con el estado del repositorio. En OpenCode los bloques de shell del SKILL.md (los que empiezan con el signo de exclamación) no se expanden, así que obtén ese contexto tú antes de la Fase 1:

- `git status --short`
- `git branch --show-current`
- Listado del contenido de `specs/` (si la carpeta no existe, dilo)
- Contenido de `specs/.spec-config.yml` (si no existe, asume `AutoCreateBranch: true`)

Argumento de este comando: $ARGUMENTS

Responde en español.

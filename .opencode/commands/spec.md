---
description: Diseña una spec siguiendo el método spec-driven (skill spec)
---

Carga la skill con id `spec` usando la herramienta `skill` y sigue sus instrucciones al pie de la letra.

La skill asume un "contexto de sesión" con la fecha y las specs existentes. En OpenCode los bloques de shell del SKILL.md (los que empiezan con el signo de exclamación) no se expanden, así que obtén ese contexto tú antes de empezar:

- Fecha de hoy: ejecuta el comando de fecha de tu shell (PowerShell: `Get-Date -Format yyyy-MM-dd`; bash: `date +%F`) y usa ese valor. No la inventes.
- Specs existentes: lista el contenido de `specs/`. Si la carpeta no existe, dilo explícitamente.

Argumento de este comando: $ARGUMENTS

Si el argumento está vacío, pide al usuario una descripción de una sola frase de lo que quiere construir antes de continuar.

Responde en español.

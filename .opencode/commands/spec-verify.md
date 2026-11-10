---
description: Verifica los criterios de aceptación de una spec, los marca con evidencia y reporta fallos (agente spec-verify)
agent: spec-verify
model: opencode/nemotron-3.5-super-vl-free
---

Verifica la spec `$ARGUMENTS` siguiendo tu flujo completo: lee el contexto, extrae los criterios, usa Context7 para validar las convenciones de Next.js y Playwright para las pantallas, y marca en el archivo solo lo que hayas comprobado.

Si `$ARGUMENTS` está vacío, lista las specs disponibles en `specs/` y pide al usuario que elija una.

Responde en español.

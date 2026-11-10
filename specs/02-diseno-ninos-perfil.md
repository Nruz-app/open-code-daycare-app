# SPEC 02 — Maqueta estática de Niños y perfil del niño

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-10
> **Objetivo:** Replicar `references/pantallas/ninos.dc.html` y `references/pantallas/perfil-nino.dc.html` en `/ninos` y `/ninos/[id]` con datos de ejemplo fijos y sin interactividad.

## Por qué existe esta spec

La SPEC 01 dejó la base visual del producto (tokens, tipografías y la sidebar compartida) y la primera pantalla, el feed del personal. La gestión de niños es el siguiente bloque de la referencia y la primera pantalla que necesita una ruta con parámetro. Esta spec añade esa navegación sin abrir todavía la capa de datos: la lista y el perfil son maquetas con contenido fijo.

## Alcance

**Dentro:**

- Módulo `app/lib/mock-ninos.ts` con el tipo `Nino`, el tipo `Padre` y los ocho registros de la referencia.
- Prop opcional `active` en `app/components/app-sidebar.tsx` y enlace "Niños" apuntando a `/ninos`.
- Página `app/ninos/page.tsx` protegida con `requireRole("staff")`.
- Lista: encabezado "GESTIÓN" + "Niños", CTA "Agregar niño", buscador decorativo, separador "SALA SOLES · 8 niños" y grid de ocho tarjetas con chip o chevron.
- Página `app/ninos/[id]/page.tsx` protegida con `requireRole("staff")`, con `notFound()` para ids desconocidos.
- Perfil: enlace "Volver a Niños", avatar, nombre, edad y sala, botón "Editar", banner de alergias y notas, tarjeta de datos y columna derecha con "Resumen del día" y "PADRES VINCULADOS".
- Responsive con el patrón de la SPEC 01: sidebar fija en `md` y superiores, barra superior sticky por debajo de `md`.

**Fuera del alcance (para futuras specs):**

- Agregar niño, editar niño, resumen del día y vincular padre como pantallas o formularios.
- Avisos, mi cuenta y todo el portal de familias.
- Datos reales, base de datos, API, server actions o persistencia de cualquier tipo.
- Búsqueda funcional, filtros, orden, paginación o cualquier estado de cliente.
- Funcionalidad de los chips, del CTA o de los botones (todo es decorativo).
- Tests automatizados; la verificación es lint, `tsc` y Playwright.
- Cambios en `app/feed/page.tsx`, `app/login/page.tsx` o la landing pública.

## Modelo de datos

El contenido vive en un módulo nuevo, `app/lib/mock-ninos.ts`, porque la lista y el perfil comparten los mismos ocho niños:

```ts
export type AvatarTone = "sky" | "pink" | "mint" | "sand" | "lilac";

export type ChipNino = {
  label: string; // "MANÍ" | "LACTOSA" | "VINCULAR"
  tone: "alergia" | "pendiente";
};

export type Padre = {
  id: string;
  nombre: string;
  inicial: string;
  vinculo: string; // "Mamá" | "Papá"
  estado: "activa" | "pendiente";
  avatarTone: AvatarTone;
};

export type Nino = {
  id: string; // kebab-case: "mateo-fernandez"
  nombre: string;
  inicial: string;
  edad: string; // "3 años", se muestra tal cual
  sala: string; // "Soles"
  padresVinculados: number;
  avatarTone: AvatarTone;
  chip?: ChipNino;
  nacimiento: string; // "12 mar 2022"
  ingreso: string; // "feb 2025"
  notas?: { titulo: string; texto: string };
  padres: Padre[];
};

export function getNino(id: string): Nino | undefined;
```

Convenciones:

- Los ids son el nombre completo en kebab-case: `mateo-fernandez`, `sofia-mendez`, `benjamin-ruiz`, `valentina-soto`, `tomas-diaz`, `emma-castro`, `lucas-romero`, `olivia-vega`.
- `edad`, `nacimiento`, `ingreso`, `padresVinculados` y los textos se muestran tal cual; no se calculan.
- Los ocho niños, sus edades y sus contadores son los de la referencia: Mateo 3 años · 2 padres · chip MANÍ; Sofía 2 · 1 · chevron; Benjamín 3 · 2 · chevron; Valentina 2 · 0 · chip VINCULAR; Tomás 3 · 1 · chip LACTOSA; Emma 2 · 1 · chevron; Lucas 3 · 1 · chevron; Olivia 2 · 1 · chevron.
- Solo Mateo lleva `notas` y solo Mateo trae los padres de la referencia: Lucía Fernández (Mamá, `activa`) y Diego Fernández (Papá, `pendiente`).
- Los demás niños llevan en `padres` tantos registros como indica `padresVinculados`, con el apellido del niño; son datos de ejemplo, no aparecen en la referencia. Valentina lleva `padres: []`.
- `chip.tone` decide los colores: `alergia` = fondo rosa cálido, `pendiente` = fondo rosa suave.
- `avatarTone` reproduce la rotación de colores pastel de la referencia (celeste, rosa, verde, arena, lila).

## Plan de implementación

1. Crear `app/lib/mock-ninos.ts` con los tipos `AvatarTone`, `ChipNino`, `Padre` y `Nino`, el array `ninos` con los ocho registros y el helper `getNino(id)`. No hay UI todavía; `npx tsc --noEmit` pasa.
2. Añadir el prop opcional `active?: "feed" | "ninos" | "avisos" | "cuenta"` a `AppSidebar`, con valor por defecto `"feed"`, marcar el ítem correspondiente y enlazar "Niños" a `/ninos`. Manual: `/feed` sigue mostrando Feed como activo y `/ninos` marcará Niños.
3. Crear `app/ninos/page.tsx` con `requireRole("staff")`, el layout de dos columnas (`AppSidebar active="ninos"` + `main`) y el encabezado "GESTIÓN" / "Niños" con el CTA "Agregar niño".
4. Añadir a `app/ninos/page.tsx` el buscador decorativo (`<input placeholder="Buscar niño…">` sin estado) y el separador "SALA SOLES · 8 niños".
5. Añadir el grid de tarjetas mapeando `ninos`: avatar de 48 px con la inicial, nombre, "`edad` · `padresVinculados` padres vinculados" y chip o chevron; cada tarjeta enlaza a `/ninos/<id>`.
6. Ajustar el responsive de la lista: dos columnas en `md` y superiores, una columna por debajo, con el CTA "Agregar niño" dentro del contenido en mobile.
7. Crear `app/ninos/[id]/page.tsx` con `requireRole("staff")`, `const { id } = await params`, `getNino(id)` y `notFound()` si no existe; cabecera con "Volver a Niños", avatar de 84 px, nombre, "`edad` · Sala `sala`" y botón "Editar".
8. Añadir el banner de notas (solo si `notas` existe) y la tarjeta de datos con las filas "Fecha de nacimiento", "Sala" e "Ingreso".
9. Añadir la columna derecha del perfil: botón oscuro "Resumen del día", tarjeta "PADRES VINCULADOS" con los padres y sus chips ACTIVA/PENDIENTE, y la fila "Vincular otro padre" con borde punteado.
10. Ajustar el responsive del perfil: columna izquierda y derecha apiladas por debajo de `md`, ancho máximo de 820 px centrado en escritorio.
11. Verificar con `npm run lint`, `npx tsc --noEmit` y Playwright en 1440 px y 375 px.

## Criterios de aceptación

- [x] `npx tsc --noEmit` termina sin errores.
- [x] `npm run lint` no reporta errores nuevos en `app/lib/mock-ninos.ts`, `app/ninos/page.tsx`, `app/ninos/[id]/page.tsx` ni `app/components/app-sidebar.tsx`.
- [x] Sin cookie de sesión, `GET /ninos` y `GET /ninos/mateo-fernandez` redirigen a `/login`.
- [x] Con una sesión válida de rol `staff`, `/ninos` muestra "GESTIÓN", "Niños", "8 niños" y las ocho tarjetas de la referencia.
- [x] Cada tarjeta de `/ninos` enlaza a `/ninos/<id>` y muestra el chip correcto (MANÍ en Mateo, LACTOSA en Tomás, VINCULAR en Valentina) o el chevron en el resto.
- [x] `/ninos/mateo-fernandez` muestra "Mateo Fernández", "3 años · Sala Soles", el banner "Alergias y notas", las filas "Fecha de nacimiento", "Sala" e "Ingreso", y los padres "Lucía Fernández" (ACTIVA) y "Diego Fernández" (PENDIENTE).
- [x] `/ninos/valentina-soto` no muestra el banner de notas y su tarjeta de padres solo ofrece "Vincular otro padre".
- [x] `GET /ninos/no-existe` responde 404.
- [x] En `/ninos` y en `/ninos/mateo-fernandez` el ítem "Niños" de la sidebar tiene `aria-current="page"` y el ítem "Feed" no.
- [x] En 1440 px la sidebar mide 248 px y el contenido está centrado con ancho máximo de 880 px en `/ninos` y de 820 px en el perfil.
- [x] En 375 px no aparece scroll horizontal, el grid de niños queda en una columna y las dos columnas del perfil se apilan.
- [x] Escribir en el buscador de `/ninos` no altera las tarjetas visibles.
- [x] `/feed` sigue renderizando el feed y mantiene "Feed" como ítem activo de la sidebar.
- [x] Ni `/ninos` ni `/ninos/[id]` muestran textos del scaffold ("Create Next App", "Deploy Now").

## Decisiones

- **Sí:** `/ninos` y `/ninos/[id]`. El perfil es una pantalla real con parámetro, no un componente suelto; un id desconocido responde 404 con `notFound()`.
- **Sí:** `app/lib/mock-ninos.ts` compartido. La lista y el perfil leen los mismos ocho registros y no hay dos copias de los datos.
- **Sí:** prop `active` en `AppSidebar`. La sidebar se repite en todas las pantallas; una prop evita duplicar 240 líneas y mantiene `/feed` intacto con el valor por defecto.
- **Sí:** datos por niño en el mock. El perfil muestra el niño abierto, no siempre a Mateo; Valentina, sin padres, solo ofrece vincular.
- **Sí:** completar con datos de ejemplo los padres que la referencia no detalla. Solo Mateo reproduce a Lucía y Diego; el resto usa el apellido del niño para que el contador de la tarjeta cuadre.
- **Sí:** todo decorativo, sin `useState` ni componentes cliente. La spec pide interface; el buscador y los chips no filtran.
- **Sí:** `#` en "Agregar niño", "Editar", "Resumen del día" y "Vincular otro padre". Sus pantallas no existen todavía y un enlace real daría 404.
- **Sí:** responsive con el patrón de la SPEC 01. Evita inventar un patrón mobile nuevo y mantiene coherencia entre pantallas.
- **Sí:** `requireRole("staff")` en las dos páginas. `/ninos` ya está en `STAFF_ONLY` y `matches` cubre el prefijo, así que no hay que tocar `app/lib/routes.ts`.
- **No:** imágenes o avatares reales. Las iniciales con los colores del diseño reproducen la referencia sin assets.
- **No:** búsqueda, filtros, orden o paginación. Todo eso necesita datos reales o estado de cliente y va en otra spec.
- **No:** extraer `KidCard` a `app/components/`. Se usa en una sola pantalla; si otra spec lo reutiliza, se extrae entonces.

## Riesgos

| Riesgo                                                                     | Mitigación                                                                                                                   |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| En Next 16 `params` es una Promise y leerlo sin `await` rompe el perfil.     | Usar `const { id } = await params` y comprobar la guía de rutas dinámicas en `node_modules/next/dist/docs/` antes de codificar. |
| La sidebar compartida puede alterar `/feed` al añadir el prop `active`.      | El prop es opcional con valor por defecto `"feed"`; `/feed` se verifica en los criterios de aceptación.                        |
| Los chips MANÍ y LACTOSA parecen información clínica real.                   | Son etiquetas de ejemplo en un mock; no hay lógica ni persistencia asociada.                                                  |
| El id del niño puede no coincidir con el enlace de la tarjeta.               | Un solo helper `getNino(id)` y el mismo id en la tarjeta y en la URL; se cubre con la prueba de `/ninos/no-existe`.            |

## Lo que **no** entra en esta spec

- Agregar niño, editar niño, resumen del día y vincular padre.
- Avisos, mi cuenta y el portal de familias.
- Datos reales, base de datos, API o persistencia.
- Búsqueda o filtros funcionales.
- Tests automatizados.
- Cambios en `/feed`, `/login` y la landing pública.

Cada uno de esos puntos, si llega, va en su propia spec.

## Verificación

- **Fecha:** 2026-11-10
- **Modelo:** opencode/nemotron-3.5-super-vl-free
- **Entorno:** Next.js 16.4.5, `npm run dev` en http://localhost:3000 (servidor arrancado por sesión previa)
- **Resultado:** 14/14 criterios verificados · 0 fallos · 0 bloqueos

| # | Criterio | Resultado | Evidencia |
| --- | --- | --- | --- |
| 1 | `npx tsc --noEmit` termina sin errores. | ✅ | Salida vacía, código de salida 0. |
| 2 | `npm run lint` no reporta errores nuevos en archivos de esta spec. | ✅ | 10 problemas (2 errores, 8 avisos) todos en `references/pantallas/support.js` (preexistente, ajeno a SPEC 02). Ningún archivo de SPEC 02 con errores. |
| 3 | Sin cookie de sesión, `GET /ninos` y `GET /ninos/mateo-fernandez` redirigen a `/login`. | ✅ | `curl -D -` → `307 Temporary Redirect` con `location: /login?next=%2Fninos` y `location: /login?next=%2Fninos%2Fmateo-fernandez`. |
| 4 | Con sesión `staff`, `/ninos` muestra "GESTIÓN", "Niños", "8 niños" y ocho tarjetas. | ✅ | Playwright snapshot: encabezado "GESTIÓN" / "Niños", separador "SALA SOLES · 8 niños", 8 enlaces `<a href="/ninos/<id>">`. |
| 5 | Cada tarjeta enlaza a `/ninos/<id>` con chip/chevron correcto. | ✅ | Snapshot: Mateo MANÍ, Tomás LACTOSA, Valentina VINCULAR; resto con chevron SVG; hrefs correctos. |
| 6 | `/ninos/mateo-fernandez` muestra perfil completo. | ✅ | Snapshot: "Mateo Fernández", "3 años · Sala Soles", banner "Alergias y notas", filas Fecha de nacimiento / Sala / Ingreso, padres Lucía (ACTIVA) y Diego (PENDIENTE). |
| 7 | `/ninos/valentina-soto` sin banner de notas y solo "Vincular otro padre". | ✅ | Snapshot: no hay nodo de banner "Alergias y notas"; en padres solo el enlace "Vincular otro padre". |
| 8 | `GET /ninos/no-existe` responde 404. | ✅ | Playwright network: `GET /ninos/no-existe => [404] Not Found`; título "404: This page could not be found." |
| 9 | Ítem "Niños" con `aria-current="page"`; "Feed" no. | ✅ | `browser_evaluate`: en `/ninos` y `/ninos/mateo-fernandez`, `a[href="/ninos"]` → `"page"`, `a[href="/feed"]` → `null`. |
| 10 | En 1440 px sidebar 248 px; contenido 880 px (lista) / 820 px (perfil). | ✅ | `browser_evaluate` con `getComputedStyle`: aside `248px`, `.mx-auto` `880px` en `/ninos` y `820px` en perfil. |
| 11 | En 375 px sin scroll horizontal, grid una columna, columnas apiladas. | ✅ | `browser_evaluate`: `scrollX: 0`, grid `repeat(1, minmax(0px, 1fr))`, 8 tarjetas; perfil columnas `width: 100%`. |
| 12 | Escribir en buscador no altera tarjetas. | ✅ | Se escribió "Mateo" en el input; tarjetas siguen siendo 8 (antes y después). |
| 13 | `/feed` sigue renderizando y "Feed" activo. | ✅ | Playwright en `/feed`: render del feed; `a[href="/feed"]` → `"page"`, `a[href="/ninos"]` → `null`. |
| 14 | Ni `/ninos` ni `/ninos/[id]` muestran textos del scaffold. | ✅ | `document.body.innerText`: `Create Next App` = false, `Deploy Now` = false en ambas rutas. |

### Fallos

Ninguno.

### Bloqueos

Ninguno. Todos los criterios se pudieron probar con el servidor corriendo y una sesión de demostración `staff`.

### Next.js (Context7)

- `libraryId`: `/vercel/next.js/v16.4.5`.
- Concepto 1: rutas dinámicas y `params` como Promise. Recomendación de Context7: `const { id } = await params` en un componente servidor asíncrono. El código de `app/ninos/[id]/page.tsx` (línea 38) lo cumple exactamente.
- Concepto 2: `notFound()` desde `next/navigation`. Recomendación de Context7: invocarlo en el camino de renderizado cuando el recurso no existe; genera HTTP 404 en desarrollo. El código de `app/ninos/[id]/page.tsx` (líneas 44-46) lo cumple: se verificó HTTP 404 en `/ninos/no-existe`.

### Capturas

- No se guardaron capturas con nombre de archivo (Playwright las escribe en `.playwright-mcp/`). Las evidencias de pantalla se obtuvieron con `browser_snapshot` y `browser_evaluate` en cada ruta y breakpoint.

### Conclusión

Todos los 14 criterios de aceptación de SPEC 02 se cumplen. La implementación de `app/lib/mock-ninos.ts`, `app/ninos/page.tsx`, `app/ninos/[id]/page.tsx` y el prop `active` de `app/components/app-sidebar.tsx` está completa y verificada en estático (`tsc`, `lint`) y en runtime (Playwright en 1440 px y 375 px, sesión `staff` y sin sesión).

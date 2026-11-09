# SPEC 01 — Maqueta estática del feed como home del personal

> **Estado:** Implementado
> **Depende de:** Ninguna
> **Fecha:** 2026-11-09
> **Objetivo:** Replicar el diseño de `references/pantallas/feed.dc.html` en la ruta `/feed` con contenido de ejemplo fijo, dejando las fuentes y los tokens de color reutilizables en el layout global.

## Por qué existe esta spec

El repo tiene la capa de autenticación funcionando, pero la UI del producto todavía es el scaffold de `create-next-app`. Antes de construir las demás pantallas hace falta una base visual real: paleta, tipografías y el shell de navegación. Esta spec establece esa base usando el feed del personal como primera pantalla.

## Alcance

**Dentro:**

- Tokens de diseño (colores, fuentes, radios y sombras) en `app/globals.css`.
- Fredoka (títulos) y Nunito (texto) cargadas con `next/font/google` en `app/layout.tsx`.
- Componente reutilizable `app/components/app-sidebar.tsx` con logo, CTA, navegación y pie de usuario.
- Página `app/feed/page.tsx` protegida con `requireRole("staff")`.
- Encabezado del feed, composer decorativo, separador "PUBLICADO HOY" y tres tarjetas: logro, actividad con placeholder de foto y anuncio general.
- Responsive básico: sidebar fija en escritorio y barra superior en pantallas menores a `md`.
- Creación local de `.env.local` a partir de `.env.example` para que la ruta protegida pueda evaluarse.

**Fuera del alcance (para futuras specs):**

- Login, activar cuenta, vincular padre, niños, avisos, resumen del día, mi cuenta, crear publicación y detalle de publicación.
- Datos reales, base de datos, API, server actions o persistencia de cualquier tipo.
- Funcionalidad de likes, comentarios, edición o publicación (todo es decorativo).
- Landing pública `app/page.tsx`; queda intacta.
- Tests automatizados; la verificación es lint, `tsc` y Playwright.

## Modelo de datos

Esta spec no introduce datos persistidos ni estructuras nuevas en `app/lib/`.

El contenido del feed vive como una constante local en `app/feed/page.tsx`:

```ts
type FeedPost = {
  id: string;
  kind: "logro" | "actividad" | "anuncio";
  author: string;
  time: string;
  audience: string;
  body: string;
  likes: number;
  comments: number;
  hasPhoto?: boolean;
};
```

Convenciones:

- `kind` define la etiqueta y los colores del chip (logro = verde, actividad = celeste, anuncio = azul).
- `time` y `likes` se muestran tal cual; no se calculan.
- Los textos son los de la referencia, incluidos "Caro Giménez", "Sala Soles" y "Mateo".

## Plan de implementación

1. Crear `.env.local` copiando `.env.example` y reemplazando `SESSION_SECRET` por un valor aleatorio de 32+ caracteres. No se versiona. Con esto `/feed` puede resolver la sesión y el resto del plan es verificable.
2. En `app/globals.css`, definir en `@theme inline` los tokens de color del diseño y los alias de fuente, y eliminar el bloque de modo oscuro y la fuente Arial. Aplicar `background`, `color` y `font-family` base al `body`.
3. En `app/layout.tsx`, reemplazar Geist por `Fredoka` y `Nunito` con variables `--font-display` y `--font-sans`, cambiar `lang` a `es` y ajustar `metadata` (título "OpenDayCare", descripción del portal). La app sigue renderizando el scaffold, ahora con la nueva base tipográfica.
4. Crear `app/components/app-sidebar.tsx` como componente sin estado: logo y subtítulo "Sala Soles", CTA "Nueva publicación", cuatro ítems de navegación (Feed activo, Niños, Avisos, Mi cuenta) y pie con avatar, nombre y rol. Todos los enlaces usan `href="#"` salvo Feed, que apunta a `/feed`.
5. Crear `app/feed/page.tsx`: llamar a `requireRole("staff")` y montar el layout de dos columnas (`aside` + `main`) con sidebar y ancho de contenido máximo de 760 px.
6. Añadir a `app/feed/page.tsx` el encabezado ("GUARDERÍA · SALA SOLES", "Buenas, Caro", "12 niños · martes 17 jun") y el composer decorativo con avatar, texto "Compartí un momento…" e icono de cámara.
7. Añadir el separador "PUBLICADO HOY" y mapear la constante `FeedPost[]` a tres tarjetas con su chip de color, destinatario, cuerpo, fila de likes/comentarios y enlace "Editar". La tarjeta de actividad muestra el placeholder de foto con borde punteado; no se carga ninguna imagen.
8. Ajustar el responsive: en `md` y superiores la sidebar mide 248 px, es fija y ocupa el alto de la ventana; por debajo de `md` se convierte en una barra superior sticky con logo, navegación horizontal y avatar, y el CTA aparece dentro del contenido. Sin JavaScript ni drawer.
9. Verificar con `npm run lint`, `npx tsc --noEmit` y Playwright en 1440 px y 375 px.

## Criterios de aceptación

- [ ] `npx tsc --noEmit` termina sin errores.
- [ ] `npm run lint` no reporta errores nuevos.
- [ ] Sin cookie de sesión, `GET /feed` redirige a `/login`.
- [ ] Con una sesión válida de rol `staff`, `/feed` renderiza el encabezado "GUARDERÍA · SALA SOLES", el saludo "Buenas, Caro" y las tres tarjetas de la referencia.
- [ ] El `font-family` calculado del `h1` incluye `Fredoka` y el del `body` incluye `Nunito`.
- [ ] El fondo calculado del `body` es `#F6ECDF`.
- [ ] En 1440 px la sidebar mide 248 px, está sticky y el contenido está centrado con ancho máximo de 760 px.
- [ ] En 375 px no aparece scroll horizontal y la navegación sigue visible en una barra superior.
- [ ] La ruta `/feed` no muestra textos del scaffold ("Create Next App", "Deploy Now").
- [ ] `app/page.tsx` sigue mostrando el scaffold sin cambios.

## Decisiones

- **Sí:** maqueta estática sin capa de datos. El pedido es dejar el estilo del diseño; conectar datos reales corresponde a otra spec.
- **Sí:** `/feed` protegido con `requireRole("staff")`. Mantiene el patrón de `app/lib/dal.ts` y la ruta ya existe en `STAFF_ONLY` y `HOME_BY_ROLE`; no hay que tocar `app/lib/routes.ts`.
- **Sí:** tokens globales en `@theme inline`. Tailwind v4 es CSS-first; además las variables de `next/font` necesitan que los utilitarios referencien la variable, no que copien su valor.
- **Sí:** `app/components/app-sidebar.tsx` como componente aparte. La sidebar se repite en todas las pantallas de `references/pantallas/`; extraerla ahora evita duplicarla después.
- **Sí:** copiar los textos de la referencia tal cual. Son datos de ejemplo y sirven para comparar fidelidad 1:1.
- **Sí:** barra superior en mobile en lugar de drawer. Un drawer requiere estado de cliente y esta spec es estática.
- **No:** modo oscuro. La referencia es cálida y clara; el bloque `prefers-color-scheme` del scaffold se elimina.
- **No:** Geist ni `tailwind.config.*`. Se reemplazan por Fredoka/Nunito y tokens CSS.
- **No:** enlaces de navegación funcionales. Solo Feed apunta a `/feed`; el resto usa `#` hasta que existan esas pantallas.
- **No:** imágenes reales. El placeholder punteado reproduce la referencia sin depender de assets.

## Riesgos

| Riesgo                                                                 | Mitigación                                                                                                                       |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `/login` no está implementado, así que no hay forma de iniciar sesión. | Para la revisión visual se inyecta una cookie firmada generada localmente con `encodeSession`. No se añade código de producto.    |
| Sin `SESSION_SECRET`, `decodeSession` falla cerrado y todo redirige.   | El paso 1 crea `.env.local` antes de evaluar la pantalla.                                                                        |
| `next/font/google` descarga fuentes en tiempo de build.                | Se dejan las fuentes configuradas con `display: "swap"`; si la descarga falla, Next usa la fuente de respaldo sin romper el layout. |
| Los nombres de token pueden chocar con utilitarios de Tailwind.        | Se usa el prefijo `--color-*` con nombres propios (`cream`, `surface`, `ink`, `coral`, `sky`, `mint`, `lilac`).                    |

## Lo que **no** entra en esta spec

- Las otras pantallas de `references/pantallas/`.
- Autenticación nueva, login real o gestión de usuarios.
- Publicar, likear, comentar o editar de verdad.
- Persistencia, base de datos o API.
- Tests automatizados.
- Landing pública y rediseño de `app/page.tsx`.

Cada uno de esos puntos, si llega, va en su propia spec.

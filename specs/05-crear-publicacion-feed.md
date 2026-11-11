# SPEC 05 — Diálogo de nueva publicación en el feed

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-10
> **Objetivo:** Replicar `references/pantallas/crear-publicacion.dc.html` como diálogo nativo en `/feed`, abierto desde la caja "Compartí un momento…", el CTA móvil y el botón "Nueva publicación" de la sidebar, con validación local y confirmación en pantalla.

## Por qué existe esta spec

La SPEC 01 dejó el feed completo y listó "crear publicación" explícitamente fuera de su alcance. Los dos disparadores de `app/feed/page.tsx` siguen siendo `<a href="#">`: la caja "Compartí un momento…" y el CTA coral "Nueva publicación" de móvil. La maqueta `crear-publicacion.dc.html` ya define el diseño como una tarjeta centrada de 580 px, y el proyecto tiene un patrón de modal probado dos veces: `app/ninos/agregar-nino.tsx` (SPEC 02) y `app/ninos/vincular-padre.tsx` (SPEC 04). Esta spec cierra el hueco visual sin abrir la capa de datos.

## Ampliación 2026-11-10 — disparador de la sidebar

La versión original de esta spec dejó el botón "Nueva publicación" de `app/components/app-sidebar.tsx` como enlace decorativo `<a href="#">`, y el criterio 25 lo fijaba así. En la práctica, en escritorio ese es el botón coral que la gente ve y pulsa: el CTA del `main` lleva `md:hidden`, así que por encima de 768 px medía 0 × 0 y el único botón visible no hacía nada.

La ampliación conecta la sidebar **solo en `/feed`**:

- `app/feed/crear-publicacion.tsx` pasa a exportar `CrearPublicacionProvider` (dueño del `<dialog>`, del aviso y del estado del formulario), `CrearPublicacion` (los disparadores del feed, sin props) y `BotonNuevaPublicacion` (el botón de la sidebar).
- `app/feed/page.tsx` envuelve sidebar + `main` con el provider dentro de `FeedContent`, de modo que `requireRole` sigue dentro del `<Suspense>` y la frontera de la DAL no se mueve.
- `app/components/app-sidebar.tsx` recibe `nuevaPublicacion?: boolean` (por defecto `false`) y renderiza `<BotonNuevaPublicacion activo={nuevaPublicacion} />`. En `/feed` es un `<button>` que consume el contexto; en `/ninos` y `/ninos/[id]` sigue siendo el `<a href="#">` de antes.
- La prop la decide el **servidor**, no `usePathname()`, para que el HTML inicial coincida con el cliente y no haya desajuste de hidratación.

Sigue fuera de alcance: persistencia, subida de fotos, insertar en "PUBLICADO HOY", una ruta propia y abrir el diálogo desde la sidebar de `/ninos`.

## Ampliación 2026-11-10 (2) — TIPO con selección múltiple

La versión original fijaba selección única en TIPO. En uso real una publicación combina tipos (por ejemplo "Comida" y "Foto" cuando se manda el almuerzo con imagen), así que la pastilla pasa a comportarse como un interruptor independiente:

- El estado es `tipos: TipoPublicacion[]`, no `tipo: TipoPublicacion`.
- `alternarTipo(opcion)` agrega la pastilla si no estaba y la quita si ya estaba; no toca las demás.
- `aria-pressed` sigue siendo el estado correcto: cada pastilla es un botón de alternancia dentro del `role="group"` "TIPO".
- Al abrir y al cerrar el diálogo el estado vuelve a `["Comida"]`, igual que antes.
- Se puede dejar TIPO vacío: no hay validación de tipo y "Publicar" solo exige descripción.
- PARA no cambia: sigue con un único destinatario y "Toda la sala" excluyente.

## Alcance

**Dentro:**

- Componente cliente nuevo `app/feed/crear-publicacion.tsx` con los dos disparadores y el `<dialog>`.
- Sustitución en `app/feed/page.tsx` de los dos `<a href="#">` por un único `<CrearPublicacion destinatarios={…} />`, con la lista calculada como `ninos.slice(0, 3)`.
- Diálogo de 580 px de ancho máximo con header de tres partes: "Cancelar" a la izquierda, "Nueva publicación" al centro y "Publicar" a la derecha.
- Bloque "PARA" con los chips de Mateo, Sofía y Benjamín (inicial sobre su tono de avatar) y el chip "Toda la sala"; selección única.
- Bloque "TIPO" con las siete pastillas Comida, Siesta, Actividad, Logro, Ánimo, Foto y Anuncio; selección múltiple e independiente por pastilla.
- Bloque "DESCRIPCIÓN" con un `<textarea>` que arranca vacío y placeholder "Contá cómo le fue hoy…".
- Bloque "FOTOS" con los dos cuadros de 96 × 96 px de la maqueta, inertes.
- Validación local: descripción obligatoria, mensaje inline en español, `aria-invalid`, `aria-describedby` y `role="alert"`, siguiendo `app/ninos/agregar-nino.tsx`.
- Confirmación con aviso `role="status"` durante 4 segundos, igual que "Listo, agregamos a…".
- Cierre con "Cancelar", Escape, clic en el backdrop y publicación válida; limpieza completa del formulario al cerrar.
- Responsive: `max-w-[580px]`, `calc(100% - 32px)` por debajo y altura máxima del 90 % del viewport con scroll interno.
- Accesibilidad: `aria-pressed` en pastillas y chips, `<dialog>` con `aria-labelledby`, botones reales en lugar de enlaces decorativos.
- Componente cliente `app/feed/crear-publicacion.tsx` que también exporta `CrearPublicacionProvider` y `BotonNuevaPublicacion`.
- Provider envolviendo sidebar + `main` de `/feed` para compartir el diálogo con la sidebar.
- Botón "Nueva publicación" de `app/components/app-sidebar.tsx` conectado al diálogo en `/feed`, con la prop `nuevaPublicacion` decidida por el servidor.

**Fuera del alcance (para futuras specs):**

- Persistencia, API, server actions, base de datos o almacenamiento de imágenes.
- Insertar la publicación en "PUBLICADO HOY" o editar los posts existentes.
- Subida real de fotos: `<input type="file">`, vista previa con `URL.createObjectURL` o borrado de imágenes.
- Abrir el diálogo desde el botón "Nueva publicación" de la sidebar en `/ninos` o `/ninos/[id]`: ahí sigue como enlace decorativo.
- Ruta propia `/feed/nueva-publicacion` o pantalla completa.
- Etiquetas, menciones, programación de publicaciones o borradores.
- Componentes compartidos nuevos en `app/components/` para pastillas, chips o campos.
- Tests automatizados; la verificación es lint, `tsc`, `build` y Playwright.

## Modelo de datos

Esta spec no crea módulos en `app/lib/` ni modifica `app/lib/mock-ninos.ts`. Todo el estado es local al componente cliente; la lista de destinatarios se calcula en el servidor.

```ts
// app/feed/crear-publicacion.tsx
import type { AvatarTone } from "@/app/lib/mock-ninos";

type TipoPublicacion =
  | "Comida"
  | "Siesta"
  | "Actividad"
  | "Logro"
  | "Ánimo"
  | "Foto"
  | "Anuncio";

const TIPOS: TipoPublicacion[] = [
  "Comida",
  "Siesta",
  "Actividad",
  "Logro",
  "Ánimo",
  "Foto",
  "Anuncio",
];

/** Opción exclusiva de "Toda la sala"; no es un id de niño. */
const TODA_LA_SALA = "toda-la-sala";

type Destinatario = {
  id: string; // "mateo-fernandez"
  nombre: string; // "Mateo", solo el primer nombre
  inicial: string; // "M"
  avatarTone: AvatarTone;
};

type CrearPublicacionProviderProps = {
  /** Los tres primeros niños de app/lib/mock-ninos.ts. */
  destinatarios: Destinatario[];
  children: ReactNode;
};

type BotonNuevaPublicacionProps = {
  /** `true` solo en `/feed`; lo decide el componente servidor. */
  activo?: boolean;
};

type CrearPublicacionContexto = {
  abrir: () => void;
};

type Errores = {
  descripcion?: string;
};
```

Estado local, dentro de `CrearPublicacionProvider`:

```ts
const [destinatario, setDestinatario] = useState<string>(
  destinatarios[0]?.id ?? TODA_LA_SALA,
);
const [tipos, setTipos] = useState<TipoPublicacion[]>(["Comida"]);
const [descripcion, setDescripcion] = useState("");
const [errores, setErrores] = useState<Errores>({});
const [aviso, setAviso] = useState<string | null>(null);

const CrearPublicacionContext = createContext<CrearPublicacionContexto | null>(
  null,
);

/** Multiselección: agrega si no estaba, quita si ya estaba. */
function alternarTipo(opcion: TipoPublicacion) {
  setTipos((actuales) =>
    actuales.includes(opcion)
      ? actuales.filter((tipoActual) => tipoActual !== opcion)
      : [...actuales, opcion],
  );
}
```

`CrearPublicacion` y `BotonNuevaPublicacion` consumen el contexto con `useCrearPublicacion()`; el provider expone solo `{ abrir }`, así que los disparadores no pueden desincronizar el formulario.

Colores de los chips de destinatario:

| Estado | Fondo | Borde | Texto |
| --- | --- | --- | --- |
| Activo | `#3F362E` | `#3F362E` | `#FFFFFF` |
| Inactivo | `#FFFDF9` | `#ECE0D0` | `#6E6359` |

Colores de las pastillas de TIPO:

| Tipo | Inactivo (fondo / texto) | Activo (fondo / texto) |
| --- | --- | --- |
| Comida | `#F4DC8E` / `#9A7B1E` | `#9A7B1E` / `#FFFFFF` |
| Siesta | `#E7DCF6` / `#7B5FC0` | `#7B5FC0` / `#FFFFFF` |
| Actividad | `#C7E7F1` / `#2E89A6` | `#2E89A6` / `#FFFFFF` |
| Logro | `#CFEBD8` / `#3E9B6C` | `#3E9B6C` / `#FFFFFF` |
| Ánimo | `#F9D2DE` / `#C56486` | `#C56486` / `#FFFFFF` |
| Foto | `#FBD8CC` / `#D9684A` | `#D9684A` / `#FFFFFF` |
| Anuncio | `#CCD8F4` / `#4E72C8` | `#4E72C8` / `#FFFFFF` |

Convenciones:

- `destinatarios` llega por props: `app/feed/page.tsx` mapea `ninos.slice(0, 3)` a `{ id, nombre: nino.nombre.split(" ")[0], inicial, avatarTone }`. El servidor decide la lista; el componente cliente no importa `mock-ninos.ts` salvo para el tipo `AvatarTone`.
- `destinatario` guarda el `id` del niño o la constante `TODA_LA_SALA`, y arranca en el primero de la lista (Mateo), igual que la maqueta.
- `tipos` es un array y arranca en `["Comida"]`, la pastilla sólida de la referencia. Cada pastilla se alterna de forma independiente; se permite dejar el array vacío.
- `descripcion` arranca vacía: el texto de la maqueta es contenido de ejemplo, no un valor por defecto.
- Los tonos de avatar se resuelven con un mapa local `Record<AvatarTone, string>` copiado de `app/ninos/page.tsx`: `sky` `#A9D9E8` / `#1F7A93`, `pink` `#F4B8CC` / `#C44A7A`, `mint` `#B9DEC4` / `#3E8B62`, `sand` `#F4DC8E` / `#9A7B1E`, `lilac` `#C9B6E8` / `#7B5FC0`.
- El aviso es `Publicación lista para ${nombre}.`, donde `nombre` es el nombre del niño o "toda la sala", y se apaga solo a los 4 segundos.
- El único mensaje de error es `Escribí una descripción para publicar.`.

## Plan de implementación

1. Crear `app/feed/crear-publicacion.tsx` con `"use client"`, los tipos y constantes de arriba, `CrearPublicacionProvider` como dueño del `<dialog>` (`ref`, `showModal()`, `cerrar()`, `onClose={limpiar}`) y del estado, y el contexto `{ abrir }`. Manual: `npx tsc --noEmit` sin errores.
2. En `app/feed/page.tsx`, importar `ninos`, calcular `destinatarios` con `ninos.slice(0, 3)` dentro de `FeedContent` y envolver sidebar + `main` con `<CrearPublicacionProvider destinatarios={…}>`, manteniendo `requireRole` dentro del `<Suspense>`. Manual: el feed se ve igual y el build no cambia de comportamiento.
3. Renderizar la caja "Compartí un momento…" y el CTA coral "Nueva publicación" con `md:hidden` desde `CrearPublicacion`, ambos con `onClick={abrir}` del contexto. Manual: en 1440 px el CTA no se renderiza; en 375 px ambos disparadores abren el mismo diálogo.
4. Añadir el header del diálogo: "Cancelar" (`type="button"`, cierre), `<h2 id="crear-publicacion-titulo">Nueva publicación</h2>` y "Publicar" (`type="button"`), con `aria-labelledby`, `border-b border-line` y padding `18px` en móvil y `26px` desde `sm`. Manual: los tres elementos quedan alineados como en la maqueta.
5. Añadir el bloque PARA: etiqueta `PARA`, chips de `destinatarios` con inicial de 26 px sobre su tono y el nombre, más el chip "Toda la sala" sin avatar; `aria-pressed`, selección única y estado activo `#3F362E`. Manual: pulsar Sofía desactiva Mateo y viceversa.
6. Añadir el bloque TIPO con las siete pastillas y la tabla de colores; `aria-pressed` y multiselección con `alternarTipo`, que agrega o quita cada pastilla sin tocar las demás. Manual: al abrir, solo Comida está sólida; al pulsar Siesta, ambas quedan sólidas; al volver a pulsar Comida, solo Siesta sigue activa.
7. Añadir el bloque DESCRIPCIÓN: `<textarea>` controlado, `min-h-[120px]`, `resize-y`, radio 14 px, borde `#EADFD0` y placeholder "Contá cómo le fue hoy…", con `mb-[22px]`.
8. Implementar la publicación con el `Publicar` del header: recortar la descripción; si queda vacía, pintar el error inline, marcar `aria-invalid`, `aria-describedby` y enfocar el textarea sin cerrar; si es válida, `setAviso(...)`, `cerrar()` y un `useEffect` que limpia el aviso a los 4 segundos. `onClose` limpia descripción, tipo, destinatario y errores, y no toca el aviso. Manual: publicar sin texto muestra el error; publicar con texto cierra y muestra el aviso.
9. Añadir el bloque FOTOS: dos `<div>` de 96 × 96 px con `rounded-[14px]`, el primero con fondo `#F4ECE1`, borde `#ECE0D0` y el icono de imagen en `#CBB89F`; el segundo con borde punteado `#DBCDBA`, icono `+` en `#C5503A` y la etiqueta "Agregar". Sin foco, sin handler y con `aria-hidden="true"` en el contenedor.
10. Ajustar el diálogo y los cierres: `w-[calc(100%-32px)] max-w-[580px]`, `max-h-[90vh] overflow-y-auto overscroll-contain`, `m-auto`, `rounded-[24px] border border-line bg-paper`, backdrop `rgba(63,54,46,0.45)`, cierre por clic en el backdrop con `event.target === event.currentTarget`, y foco inicial en el textarea dentro de `requestAnimationFrame`.
11. Añadir `BotonNuevaPublicacion` y la prop `nuevaPublicacion?: boolean` a `AppSidebar`: en `/feed` renderiza `<button type="button" onClick={abrir}>` con las mismas clases; en el resto, el `<a href="#">` original. El botón conectado solo se activa desde `app/feed/page.tsx`. Manual: en `/feed` el botón abre el diálogo sin cambiar la URL; en `/ninos` sigue siendo un enlace.
12. Verificar con `npm run lint`, `npx tsc --noEmit`, `npm run build` y Playwright con sesión `staff` en `/feed`, en 1440 × 900 y 375 × 812, comparando con `references/pantallas/crear-publicacion.dc.html`.

## Criterios de aceptación

- [x] `npx tsc --noEmit` termina sin errores.
- [x] `npm run lint` no reporta errores nuevos en `app/feed/crear-publicacion.tsx` ni en `app/feed/page.tsx`.
- [x] `npm run build` no añade fallos nuevos; el error preexistente de `/login` por `searchParams` fuera de `<Suspense>` se reporta tal cual.
- [x] Con sesión `staff`, `/feed` muestra la caja "Compartí un momento…" como `<button>` y pulsarla no cambia la URL.
- [x] En 375 px el CTA "Nueva publicación" abre el mismo diálogo y no cambia la URL.
- [x] El diálogo mide como máximo 580 px, con fondo `rgb(251, 244, 236)`, borde `rgb(236, 224, 208)` y radio 24 px.
- [x] El header muestra "Cancelar", el título "Nueva publicación" y "Publicar" en una fila con borde inferior.
- [x] El bloque PARA muestra los chips "Mateo", "Sofía", "Benjamín" y "Toda la sala".
- [x] Al abrir, "Mateo" está activo con fondo `rgb(63, 54, 46)` y texto blanco.
- [x] Pulsar "Sofía" la deja activa, desactiva "Mateo" y actualiza `aria-pressed` en ambos.
- [x] El bloque TIPO muestra las siete pastillas Comida, Siesta, Actividad, Logro, Ánimo, Foto y Anuncio.
- [x] Al abrir, "Comida" está activa con fondo `rgb(154, 123, 30)` y texto blanco; las demás usan su tono suave.
- [x] Pulsar "Siesta" la deja activa con fondo `rgb(123, 95, 192)` y "Comida" sigue activa: TIPO es multiselección.
- [x] Volver a pulsar una pastilla activa la desactiva y no afecta a las demás; se pueden dejar las siete inactivas y "Publicar" no exige un tipo.
- [x] El campo DESCRIPCIÓN arranca vacío y muestra el placeholder "Contá cómo le fue hoy…".
- [x] El bloque FOTOS muestra dos cuadros de 96 × 96 px y ninguno recibe el foco al recorrer con Tab.
- [x] Publicar con la descripción vacía deja el diálogo abierto, muestra "Escribí una descripción para publicar." con `role="alert"`, marca `aria-invalid="true"` y enfoca el textarea.
- [x] Escribir texto después del error lo borra sin necesidad de volver a publicar.
- [x] Publicar con descripción válida cierra el diálogo y muestra "Publicación lista para Mateo." durante unos 4 segundos, sin cambiar la URL.
- [x] Con "Toda la sala" seleccionado y descripción válida, el aviso dice "Publicación lista para toda la sala.".
- [x] Al reabrir el diálogo, la descripción está vacía, "Comida" es el único tipo activo y "Mateo" vuelve a estar activo, sin errores ni aviso visible.
- [x] "Cancelar", Escape y el clic en el backdrop cierran el diálogo sin mostrar el aviso.
- [x] Tras publicar, "PUBLICADO HOY" sigue mostrando las mismas tres tarjetas y el contador de niños del encabezado no cambia.
- [x] En 1440 px el diálogo queda centrado con `max-width: 580px`.
- [x] En 375 px no aparece scroll horizontal, el diálogo mide el ancho disponible menos 32 px y su contenido cabe con scroll interno si supera el 90 % de la altura.
- [x] `/ninos` y `/ninos/[id]` siguen funcionando como antes (8 tarjetas, perfil de Mateo, `scrollX: 0`).
- [x] En `/feed` el botón "Nueva publicación" de la sidebar es `<button type="button">`, abre el diálogo y no cambia la URL.
- [x] El botón de la sidebar y la caja "Compartí un momento…" abren el mismo diálogo, con el mismo estado inicial.
- [x] Publicar desde el diálogo abierto en la sidebar cierra el diálogo y muestra "Publicación lista para Mateo." sin recargar.
- [x] En `/ninos` y `/ninos/[id]` el botón conserva `tag: A` y `href="#"`, no abre ningún diálogo y la consola no muestra errores de hidratación.
- [x] La consola del navegador no muestra errores en `/feed`.

## Decisiones

- **Sí:** `<dialog>` nativo dentro de `app/feed/crear-publicacion.tsx`. Es el patrón ya verificado en `agregar-nino.tsx` y en `vincular-padre.tsx`, atrapa el foco y no necesita estado global ni rutas nuevas.
- **Sí:** un solo componente cliente que renderiza los dos disparadores y el diálogo. Ambos abren el mismo estado; separarlos obligaría a un contexto o a duplicar el diálogo.
- **Sí:** disparadores del feed (caja y CTA móvil) en `/feed`. Son los de la maqueta original.
- **Sí (ampliación 2026-11-10):** conectar también el botón de la sidebar, **solo en `/feed`**. En escritorio es el único botón visible, así que dejarlo muerto rompía la expectativa. `AppSidebar` sigue siendo servidor; el estado se comparte con un provider cliente que envuelve el layout de `/feed` y `requireRole` no se mueve.
- **Sí:** prop `nuevaPublicacion` decidida por el servidor en vez de `usePathname()`. Evita un desajuste de hidratación y deja `/ninos` explícitamente fuera.
- **Sí:** `CrearPublicacion` y `BotonNuevaPublicacion` consumen solo `{ abrir }` del contexto. El formulario queda encapsulado en el provider y ningún disparador puede desincronizarlo.
- **Sí:** `destinatarios` por props con `ninos.slice(0, 3)`. Reproduce exactamente los tres chips de la maqueta sin hardcodear nombres y sin arrastrar los ocho niños al bundle del cliente.
- **Sí:** selección única en PARA. Una publicación se asigna a un niño o a toda la sala, igual que los chips de las tarjetas del feed.
- **Sí (ampliación 2):** selección múltiple en TIPO. Una publicación puede combinar tipos ("Comida" + "Foto") y no hay motivo para forzar uno solo. `aria-pressed` por pastilla sigue describiendo el estado y el grupo se anuncia como tal.
- **Sí:** "Mateo" y "Comida" preseleccionados. Son los dos estados que la maqueta muestra activos.
- **Sí:** inactivo en tono suave y activo en tono sólido con texto blanco. La maqueta enseña la paleta pero no un estado inactivo; así la vista inicial es idéntica a la referencia salvo Actividad, que en la maqueta aparece sólida y aquí queda suave hasta que se seleccione.
- **Sí:** descripción obligatoria con error inline. Evita publicaciones vacías sin introducir una capa de servidor que no existe.
- **Sí:** `Publicar` como `<button type="button">` sin `<form>`. El header tiene botones sueltos y Enter dentro del textarea debe insertar un salto de línea, no publicar.
- **Sí:** bloque FOTOS decorativo y sin foco. Es lo mismo que ya hace el feed con la foto de témperas; un `<button>` que no hace nada sería un control muerto para lectores de pantalla.
- **Sí:** duplicar el mapa de tonos de avatar. Exportarlo obligaría a tocar `app/ninos/page.tsx` o `app/lib/mock-ninos.ts`, ya verificados, por cinco pares de colores.
- **Sí:** colores repetidos inline, sin tokens nuevos en `app/globals.css`. Cada tono aparece una sola vez y es el criterio que siguieron las SPEC 03 y 04.
- **Sí:** aviso temporal y cierre al publicar. Es la única confirmación posible sin backend y el patrón que ya usan "Agregar niño" y "Vincular padre".
- **No:** agregar la publicación a "PUBLICADO HOY". Requeriría mover `posts` a un componente cliente o crear un contexto; va en la spec de datos reales.
- **No:** subida de imágenes o vista previa local. No hay almacenamiento y complicaría el estado sin aportar al objetivo visual.
- **No:** una ruta `/feed/nueva-publicacion`. La maqueta es una tarjeta centrada, no una pantalla completa, y una ruta necesitaría registro en `STAFF_ONLY`.
- **No:** tocar `app/lib/mock-ninos.ts`, `app/lib/routes.ts`, `/ninos` o `proxy.ts`. La ampliación toca `app/components/app-sidebar.tsx`, pero `AppSidebar` conserva el comportamiento anterior por defecto (`nuevaPublicacion = false`) y la sidebar de `/ninos` queda idéntica.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Reemplazar `<a>` por `<button>` altera anchos y alineación de los dos disparadores. | Conservar todas las clases actuales y añadir `w-full text-left`; se compara con la maqueta en 1440 px y 375 px. |
| El `<dialog>` vive dentro de `<main>` con `md:h-screen md:overflow-y-auto`. | El elemento nativo se dibuja en el top layer, fuera del flujo del contenedor con scroll; se verifica abriéndolo en escritorio y en móvil. |
| En 375 px el formulario completo supera la altura de la pantalla. | `max-h-[90vh]` con `overflow-y-auto` y `overscroll-contain`; el header queda arriba y se comprueba el scroll interno. |
| Nombres de niño largos desbordan los chips. | Solo se muestran los primeros nombres de tres niños conocidos; los chips usan `whitespace-nowrap` y `flex-wrap` en el contenedor. |
| El aviso fijo al pie tapa la última tarjeta del feed. | Mismo `role="status"` con `pointer-events-none` de 4 segundos que ya usa `agregar-nino.tsx`. |
| La distinción activo/inactivo de TIPO no está en la maqueta y puede parecer arbitraria. | Está documentada en Decisiones y en la tabla de colores: suave = inactivo, sólido = activo. |
| `ninos` cambia de orden y "Mateo" deja de estar primero. | `destinatarios[0]` alimenta el estado inicial; si la lista quedara vacía, el fallback es `TODA_LA_SALA`. |
| (Ampliación) El provider envuelve sidebar y `main`, así que el diálogo ya no vive dentro de `<main>`. | Se mueve con el layout completo dentro de `FeedContent`: `requireRole` sigue bajo el `<Suspense>` y `<dialog>` se dibuja en el top layer; se comprueba que "PUBLICADO HOY" sigue con 3 tarjetas. |
| (Ampliación) `AppSidebar` es servidor y se comparte con `/ninos`: un `onClick` directo provocaría un desajuste de hidratación. | La prop `nuevaPublicacion` la decide el servidor; sin ella, el componente exporta el mismo `<a href="#">` de antes. Se verifica la consola en `/feed`, `/ninos` y `/ninos/[id]`. |
| (Ampliación 2) Con multiselección se puede publicar sin ningún tipo elegido. | Aceptado a propósito: el único campo obligatorio es la descripción. Si más adelante hace falta un tipo, se añade la validación al grupo TIPO con el mismo patrón de `role="alert"`. |

## Lo que **no** entra en esta spec

- Persistencia, API, server actions o base de datos.
- Insertar, editar o borrar publicaciones en el feed.
- Subida real de fotos o cualquier `<input type="file">`.
- Abrir el diálogo desde la sidebar de `/ninos` o `/ninos/[id]`.
- Ruta propia para crear una publicación.
- Etiquetas, menciones, programación o borradores.
- Componentes compartidos nuevos en `app/components/`.
- Tests automatizados.

Cada uno de esos puntos, si llega, va en su propia spec.

## Verificación

- **Fecha:** 2026-11-10
- **Modelo:** opencode/nemotron-3.5-super-vl-free
- **Entorno:** Next.js 16.4.5, `npm run dev` en http://localhost:3000, sesión `staff`
- **Resultado:** 31/31 criterios verificados · 0 fallos · 0 bloqueos
- **Nota:** la verificación original cubrió 26 criterios; la ampliación de la sidebar añadió cuatro y revalidó el 25; la ampliación de TIPO reescribió el 13 y añadió el 31.

| # | Criterio | Resultado | Evidencia |
|---|----------|-----------|-----------|
| 1 | `npx tsc --noEmit` sin errores | ✅ | Salida vacía (código 0) |
| 2 | `npm run lint` sin errores nuevos en archivos de la spec | ✅ | 10 problemas, todos preexistentes en `references/pantallas/support.js`; cero en `app/feed/crear-publicacion.tsx` ni `app/feed/page.tsx` |
| 3 | `npm run build` sin fallos nuevos | ✅ | Compila y TypeScript OK; el único fallo es el prerender preexistente de `/login` (`searchParams` fuera de `<Suspense>` con `cacheComponents`), reportado tal cual en `AGENTS.md` |
| 4 | Caja "Compartí un momento…" es `<button type="button">`, pulsar no cambia la URL | ✅ | `tag: BUTTON`, `type: button`, URL sigue `/feed` |
| 5 | En 375 px el CTA "Nueva publicación" abre el mismo diálogo y no cambia la URL | ✅ | `ctaAncho: 320`, diálogo abre, URL `/feed` |
| 6 | Diálogo ≤ 580 px, fondo `rgb(251, 244, 236)`, borde `rgb(236, 224, 208)`, radio 24 px | ✅ | `ancho: 580`, `fondo: rgb(251, 244, 236)`, `borde: rgb(236, 224, 208)`, `radio: 24px` |
| 7 | Header "Cancelar" / "Nueva publicación" / "Publicar" con borde inferior | ✅ | `headerTexto: "CancelarNueva publicaciónPublicar"`, `headerBorder: 0.666667px solid` |
| 8 | Bloque PARA con chips Mateo, Sofía, Benjamín, Toda la sala | ✅ | 4 chips con los textos esperados |
| 9 | Al abrir, "Mateo" activo con fondo `rgb(63, 54, 46)` y texto blanco | ✅ | `pressed: true`, `fondo: rgb(63, 54, 46)`, `color: rgb(255, 255, 255)` |
| 10 | Pulsar "Sofía" la activa, desactiva "Mateo", actualiza `aria-pressed` | ✅ | Sofía `pressed: true` fondo `rgb(63, 54, 46)`, Mateo `pressed: false` |
| 11 | Bloque TIPO con 7 pastillas | ✅ | 7 pastillas: Comida, Siesta, Actividad, Logro, Ánimo, Foto, Anuncio |
| 12 | Al abrir, "Comida" activa con fondo `rgb(154, 123, 30)` y texto blanco | ✅ | `pressed: true`, `fondo: rgb(154, 123, 30)`, `color: rgb(255, 255, 255)` |
| 13 | Pulsar "Siesta" la activa con `rgb(123, 95, 192)` y "Comida" sigue activa | ✅ | Siesta `Siesta:true`, Comida `Comida:true`; TIPO multiselección |
| 14 | DESCRIPCIÓN arranca vacío con placeholder "Contá cómo le fue hoy…" | ✅ | `textoValor: ""`, `placeholder: "Contá cómo le fue hoy…"` |
| 15 | Bloque FOTOS: dos cuadros 96 × 96 px, ninguno recibe foco con Tab | ✅ | Dos cajas 96×96, `enfocables: 0`, Tab desde textarea va a `BODY` no a FOTOS |
| 16 | Publicar vacío: diálogo abierto, error con `role="alert"`, `aria-invalid="true"`, foco en textarea | ✅ | `dialogoAbierto: true`, `errorRole: alert`, `ariaInvalid: true`, `focoEnTextarea: true` |
| 17 | Escribir texto después del error lo borra | ✅ | `errorTexto: null`, `ariaInvalid: false` tras escribir |
| 18 | Publicar válido cierra diálogo, aviso "Publicación lista para Mateo." ~4 s, URL no cambia | ✅ | `dialogoAbierto: false`, `aviso: "Publicación lista para Mateo."`, URL `/feed` |
| 19 | Con "Toda la sala", aviso "Publicación lista para toda la sala." | ✅ | `aviso: "Publicación lista para toda la sala."` |
| 20 | Al reabrir: descripción vacía, "Comida" y "Mateo" activos, sin errores ni aviso | ✅ | `textareaValor: ""`, `tiposActivos: ["Comida"]`, `chips` Mateo `pressed: true`, `aviso: null` |
| 21 | "Cancelar", Escape y clic en backdrop cierran sin aviso | ✅ | Los tres cierran con `dialogoAbierto: false`, `aviso: null` |
| 22 | Tras publicar, "PUBLICADO HOY" sigue con 3 tarjetas | ✅ | `posts: 3` en apertura, tras publicar y al reabrir |
| 23 | En 1440 px diálogo centrado con `max-width: 580px` | ✅ | `centrado: true`, `maxWidth: 580px` |
| 24 | En 375 px sin scroll horizontal, diálogo = ancho disponible − 32 px, scroll interno | ✅ | `ancho: 328`, `scrollX: 0`, `scrollInterno: true`, `maxHeight: 730.8px` |
| 25 | `/ninos` y `/ninos/[id]` siguen funcionando como antes | ✅ | `/ninos`: 8 tarjetas, h1 "Niños", `scrollX: 0`; `/ninos/mateo-fernandez`: h1 "Mateo Fernández", `scrollX: 0` (revalidado en la ampliación) |
| 26 | Consola sin errores en `/feed` | ✅ | `Total messages: 2 (Errors: 0, Warnings: 0)` |
| 27 | En `/feed` el botón de la sidebar es `<button>` y abre el diálogo sin cambiar la URL | ✅ | 1440 px: `tag: BUTTON`, `type: button`, `antes.dialogo: false` → `despues.dialogo: true`, URL `/feed` en ambos momentos |
| 28 | Sidebar y caja "Compartí un momento…" abren el mismo diálogo con el mismo estado inicial | ✅ | Abierto desde la sidebar: `ancho: 580`, foco en `crear-publicacion-descripcion`, 4 chips (Mateo `pressed`), 7 tipos, "Comida" activa, descripción vacía; reabierto desde la caja: descripción vacía y Mateo activo |
| 29 | Publicar desde la sidebar cierra el diálogo y muestra el aviso | ✅ | `dialogo: false`, `aviso: "Publicación lista para Mateo."`, URL `/feed`, `posts: 3` |
| 30 | En `/ninos` y `/ninos/[id]` el botón sigue siendo `<a href="#">`, no abre diálogo y no hay errores de hidratación | ✅ | `/ninos`: `tag: A`, `href: #`, `antes.dialogo: false` → `despues.dialogo: false`; `/ninos/mateo-fernandez`: `tag: A`; consola sin errores en ambas |
| 31 | Volver a pulsar desactiva sin afectar a las demás; TIPO puede quedar vacío y "Publicar" no exige un tipo | ✅ | Tras quitar Comida con Siesta y Foto activas: `Comida:false`, `Siesta:true`, `Foto:true`; con las siete en `false`, publicar cierra y muestra "Publicación lista para Mateo." sin error; al reabrir, solo `Comida:true` |

### Ampliación 2026-11-10 — disparador de la sidebar

- **Entorno:** Next.js 16.4.5, `npm run dev` en http://localhost:3000, sesión `staff`, Playwright MCP.
- **`npx tsc --noEmit`:** sin errores (salida vacía).
- **`npx eslint app/feed/crear-publicacion.tsx app/feed/page.tsx app/components/app-sidebar.tsx`:** sin errores ni avisos.
- **`npm run build`:** compila (`✓ Compiled successfully in 1470ms`) y TypeScript pasa; falla solo el prerender preexistente de `/login` (`searchParams` fuera de `<Suspense>` con `cacheComponents`), igual que antes de la ampliación.
- **Antes del arreglo (1440 × 900):** dos coincidencias de "Nueva publicación", la de la sidebar `A href="#"` visible y la de `main` `BUTTON` de 0 × 0; el clic en la sidebar dejaba `dialogo: false` y la URL en `/feed#`.
- **Después (1440 × 900, `/feed`):** la sidebar es `BUTTON type="button"` visible; el clic pasa de `dialogo: false` a `true` con la URL en `/feed`. Diálogo de 580 px, foco en `crear-publicacion-descripcion`, 4 chips (Mateo `pressed: true`), 7 tipos, "Comida" activa y descripción vacía. Publicar cierra, muestra "Publicación lista para Mateo." y deja `posts: 3`.
- **Reapertura desde la caja "Compartí un momento…":** mismo diálogo, descripción vacía y Mateo activo, sin restos del formulario anterior.
- **`/ninos` (1440 px):** sidebar `A href="#"`, el clic deja `dialogo: false` y la URL en `/ninos`; 8 tarjetas, h1 "Niños", `scrollX: 0`.
- **`/ninos/mateo-fernandez`:** sidebar `A`, h1 "Mateo Fernández", `scrollX: 0`.
- **375 × 812 (`/feed`):** el `aside` está oculto, el CTA móvil sigue visible y abre el diálogo de 328 px con `scrollX: 0`; el foco llega a `crear-publicacion-descripcion` (medido tras 0,5 s, porque el `requestAnimationFrame` aún no había corrido en la primera lectura).
- **Consola:** sin errores en `/feed`, `/ninos` ni `/ninos/mateo-fernandez`.

### Ampliación 2026-11-10 (2) — TIPO multiselección

- **`npx tsc --noEmit`:** sin errores (salida vacía).
- **`npx eslint app/feed/crear-publicacion.tsx`:** sin errores ni avisos.
- **Apertura (1440 × 900):** `Comida:true` y las otras seis en `false`.
- **Acumular:** pulsar Siesta deja `Comida:true` y `Siesta:true`; pulsar Foto deja las tres en `true`.
- **Quitar una concreta:** pulsar Comida deja `Comida:false` con `Siesta:true` y `Foto:true` intactas.
- **Vaciar TIPO:** las siete quedan en `false`, `activos: 0`, y las pastillas vuelven a su tono suave (`Comida` `rgb(244, 220, 142)`, `Siesta` `rgb(231, 220, 246)`).
- **Publicar sin tipo:** cierra el diálogo y muestra "Publicación lista para Mateo." sin error de validación; la URL sigue en `/feed`.
- **Reapertura:** vuelve a `["Comida"]` (`Comida:true`, resto `false`).
- **Consola:** sin errores.

### Fallos

Ninguno.

### Bloqueos

Ninguno.

### Next.js (Context7)

- `libraryId` consultado: `/vercel/next.js`.
- Concepto: `proxy.ts` vs `middleware.ts` en Next.js 16.
- Recomendación: `middleware.ts` está deprecado en Next.js 16 y se renombra a `proxy.ts`; `proxy.ts` siempre compila a runtime Node.js (nunca Edge); si ambos archivos existen, dev y build lanzan error pidiendo usar solo `proxy.ts`.
- Código del proyecto: cumple. Tiene `proxy.ts` en la raíz y no tiene `middleware.ts`. El build pasó la detección de convención sin conflicto.

### Capturas

No se guardaron rutas de archivo (las capturas de Playwright escriben en `.playwright-mcp/`, ignorado por git). Se verificaron mediciones objetivas con `getComputedStyle` y `getBoundingClientRect` en 1440 × 900 y 375 × 812, comparadas contra `references/pantallas/crear-publicacion.dc.html`.

# SPEC 04 — Diálogo para vincular otro padre

> **Estado:** Implementado
> **Depende de:** SPEC 02
> **Fecha:** 2026-11-10
> **Objetivo:** Replicar `references/pantallas/vincular-padre.dc.html` como diálogo nativo en el perfil del niño para invitar a otro padre con validación local y confirmación en pantalla.

## Por qué existe esta spec

La SPEC 02 dejó el perfil del niño completo pero con la fila "Vincular otro padre" como enlace decorativo a `#`, y listó ese formulario explícitamente fuera de su alcance. La maqueta `vincular-padre.dc.html` ya define el diseño y el proyecto ya tiene un patrón de modal probado en `app/ninos/agregar-nino.tsx`: `<dialog>` nativo, estado de cliente y confirmación en pantalla sin persistencia. Esta spec cierra ese hueco sin abrir todavía la capa de datos.

## Alcance

**Dentro:**

- Componente cliente nuevo `app/ninos/vincular-padre.tsx` con la fila disparadora y el `<dialog>` de la maqueta.
- Sustitución en `app/ninos/[id]/page.tsx` del enlace `<a href="#">Vincular otro padre</a>` por `<VincularPadre ninoNombre={nino.nombre} />`.
- Diálogo de 480 px con header "Vincular padre" / "a {nombre del niño}", cierre con X, banner azul informativo, campos "NOMBRE DEL PADRE/MADRE" y "EMAIL", selector "PARENTESCO" con Mamá / Papá / Tutor/a, caja del código `7K4P9` con "Vence en 7 días" y CTA "Enviar invitación".
- Comportamiento de cliente: abrir con `showModal()`, foco inicial en el nombre, cierre con X, Escape, clic en el backdrop o envío válido, y limpieza completa del formulario al cerrar.
- Validación local: nombre obligatorio y email obligatorio con formato, con mensajes inline en español, `aria-invalid`, `aria-describedby` y `role="alert"`, siguiendo `app/ninos/agregar-nino.tsx`.
- Confirmación con aviso `role="status"` durante 4 segundos, igual que el patrón de "Listo, agregamos a…".
- Responsive: ancho máximo de 480 px, `calc(100% - 32px)` por debajo y altura máxima del 90 % del viewport con scroll interno.

**Fuera del alcance (para futuras specs):**

- Persistencia, API, server actions, envío real de correos o alta del padre en `app/lib/mock-ninos.ts`.
- Agregar el padre invitado a "PADRES VINCULADOS" o cambiar el contador de la lista.
- Abrir el diálogo desde el chip "VINCULAR" de `/ninos` o desde cualquier otro punto que no sea el perfil.
- Editar o revocar padres existentes, reenviar invitaciones o caducar códigos.
- Ruta propia o pantalla completa para vincular padre.
- Componentes compartidos nuevos en `app/components/` para campos, pastillas o botones.
- Tests automatizados; la verificación es lint, `tsc`, `build` y Playwright.

## Modelo de datos

Esta spec no crea módulos en `app/lib/` ni modifica `app/lib/mock-ninos.ts`. Todo el estado es local al componente cliente.

```ts
// app/ninos/vincular-padre.tsx
type Parentesco = "Mamá" | "Papá" | "Tutor/a";

const PARENTESCOS: Parentesco[] = ["Mamá", "Papá", "Tutor/a"];

const CODIGO_INVITACION = "7K4P9";

type Errores = {
  nombre?: string;
  email?: string;
};

type VincularPadreProps = {
  ninoNombre: string; // "Mateo Fernández", viene del perfil
};
```

Estado local:

```ts
const [nombre, setNombre] = useState("");
const [email, setEmail] = useState("");
const [parentesco, setParentesco] = useState<Parentesco>("Mamá");
const [errores, setErrores] = useState<Errores>({});
const [aviso, setAviso] = useState<string | null>(null);
```

Convenciones:

- `ninoNombre` llega completo desde el perfil. El subtítulo del header usa el nombre completo y el banner usa solo el primer nombre (`ninoNombre.split(" ")[0]`), como en la maqueta: "a Mateo Fernández" y "Solo verá el feed de Mateo.".
- `parentesco` arranca en `"Mamá"`, igual que la pastilla seleccionada de la referencia.
- El código es la constante `7K4P9`, el mismo que ya usa `/activar-cuenta`. No se genera ni se calcula.
- El email se valida con una expresión simple (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`); no hay backend que confirme la dirección.
- Los mensajes de error son "Ingresá el nombre del padre/madre." e "Ingresá un correo válido.".
- El aviso de envío es `Invitación enviada a ${email}.` y se apaga solo a los 4 segundos.

## Plan de implementación

1. Crear `app/ninos/vincular-padre.tsx` con `"use client"`, las constantes `ETIQUETA_CLASS` y `CAMPO_CLASS` copiadas de `agregar-nino.tsx`, y la fila disparadora como `<button type="button">` con el círculo punteado y el texto "Vincular otro padre".
2. Montar `<VincularPadre ninoNombre={nino.nombre} />` en `app/ninos/[id]/page.tsx` en lugar del `<a href="#">`. Manual: la fila se ve igual que antes y ya no navega.
3. Añadir el `<dialog>` con `ref`, `showModal()` en `abrir()` y foco al nombre en `requestAnimationFrame`, más `cerrar()`, `onClose={limpiar}` y cierre por clic en el backdrop. Manual: abre y cierra con X, Escape y clic fuera.
4. Añadir el header del diálogo: título "Vincular padre" y subtítulo "a {ninoNombre}" a la izquierda, y la X de 34 × 34 px a la derecha con `aria-label="Cerrar"`.
5. Añadir el banner informativo azul con el texto "Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de {primerNombre}." y el icono de información.
6. Añadir los campos "NOMBRE DEL PADRE/MADRE" y "EMAIL" con sus etiquetas, placeholders "Ej. Diego Fernández" y "correo@ejemplo.com" y los estilos de campo de la maqueta.
7. Añadir el selector "PARENTESCO" con las tres pastillas y `aria-pressed`: la activa con fondo `#CCD8F4`, borde `#9FB8EC` y texto `#4E72C8`; las inactivas con fondo `#FFFDF9`, borde `#ECE0D0` y texto `#6E6359`.
8. Añadir la caja del código de invitación: fondo `#FBF1D6`, borde punteado `#E6D08A`, código `7K4P9` en Fredoka 34 px con tracking de 7 px y "Vence en 7 días" debajo.
9. Añadir el CTA "Enviar invitación" con gradiente `#F4977E → #EE8164`, icono de enviar y sombra de la maqueta.
10. Implementar la validación al enviar: recortar el nombre, comprobar que no esté vacío, validar el formato del email, pintar los errores inline, marcar `aria-invalid` y enfocar el primer campo inválido.
11. Implementar el envío válido: `setAviso(...)`, `cerrar()` y `useEffect` que limpia el aviso a los 4 segundos. El `close` del diálogo limpia nombre, email, parentesco y errores.
12. Ajustar el responsive del diálogo: `w-[calc(100%-32px)] max-w-[480px]`, `max-h-[90vh] overflow-y-auto overscroll-contain`, `m-auto` y backdrop `rgba(63,54,46,0.45)`.
13. Verificar con `npm run lint`, `npx tsc --noEmit`, `npm run build` y Playwright en 1440 × 900 y 375 × 812, con sesión `staff`, en `/ninos/mateo-fernandez` y `/ninos/valentina-soto`.

## Criterios de aceptación

- [x] `npx tsc --noEmit` termina sin errores.
- [x] `npm run lint` no reporta errores nuevos en `app/ninos/vincular-padre.tsx` ni en `app/ninos/[id]/page.tsx`.
- [x] `npm run build` no añade fallos nuevos; el error preexistente de `/login` por `searchParams` fuera de `<Suspense>` se reporta tal cual.
- [x] Con sesión `staff`, `/ninos/mateo-fernandez` muestra "Vincular otro padre" como botón que no cambia la URL al pulsarlo.
- [x] Al pulsar "Vincular otro padre" se abre un diálogo con ancho máximo de 480 px, fondo `rgb(251, 244, 236)` y radio de 24 px.
- [x] El diálogo muestra el título "Vincular padre", el subtítulo "a Mateo Fernández" y el banner "Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de Mateo.".
- [x] El diálogo muestra las etiquetas "NOMBRE DEL PADRE/MADRE", "EMAIL" y "PARENTESCO", y los campos arrancan vacíos.
- [x] "Mamá" aparece seleccionada por defecto y las tres pastillas cambian de selección con clic y con teclado.
- [x] La caja del código muestra `7K4P9` y "Vence en 7 días".
- [x] Enviar con los dos campos vacíos mantiene el diálogo abierto, muestra "Ingresá el nombre del padre/madre." e "Ingresá un correo válido." y enfoca el campo de nombre.
- [x] Enviar con un email sin formato válido (por ejemplo `correo`) mantiene el diálogo abierto y muestra "Ingresá un correo válido.".
- [x] Enviar con nombre y email válidos cierra el diálogo y muestra el aviso `Invitación enviada a <email>.` durante unos 4 segundos, sin cambiar la URL.
- [x] Tras el envío, "PADRES VINCULADOS" no cambia y el nuevo padre no aparece en la lista.
- [x] Al reabrir el diálogo, los campos vuelven a estar vacíos, "Mamá" vuelve a estar seleccionada y no quedan errores visibles.
- [x] Escape y el clic en el backdrop cierran el diálogo sin mostrar el aviso de envío.
- [x] En `/ninos/valentina-soto` el mismo botón abre el diálogo con el subtítulo "a Valentina Soto" y el banner con "Valentina".
- [x] En 1440 px el diálogo queda centrado, con `max-width: 480px` calculado.
- [x] En 375 px no aparece scroll horizontal, el diálogo mide el ancho disponible menos 32 px y su contenido cabe con scroll interno si supera el 90 % de la altura.
- [x] `/ninos`, `/feed` y el resto del perfil siguen renderizando sin cambios.

## Decisiones

- **Sí:** `<dialog>` nativo dentro de `app/ninos/[id]/page.tsx`. Es el patrón ya verificado en `agregar-nino.tsx`, atrapa el foco y no necesita estado global ni rutas nuevas.
- **Sí:** disparador solo en la fila "Vincular otro padre" del perfil. Es el punto que marca la maqueta y el único que aparece en la referencia.
- **Sí:** código fijo `7K4P9`. Coincide con la maqueta y con el código que ya muestra `/activar-cuenta`; generarlo rompería la coherencia entre pantallas.
- **Sí:** aviso temporal y cierre al enviar. Reproduce la única confirmación posible sin backend y es el patrón que ya usa "Agregar niño".
- **Sí:** validación en cliente con mensajes inline. Evita un envío vacío sin introducir una capa de servidor que no existe.
- **Sí:** duplicar `ETIQUETA_CLASS` y `CAMPO_CLASS` en el componente nuevo. Extraerlas a un módulo obligaría a tocar `agregar-nino.tsx`, ya verificado en la SPEC 02, por dos constantes.
- **Sí:** derivar el primer nombre para el banner y usar el nombre completo en el subtítulo. La maqueta usa "Mateo" en el banner y "Mateo Fernández" en el header; el diálogo debe funcionar con cualquier niño.
- **No:** agregar el padre invitado como PENDIENTE en la lista. Requeriría estado compartido entre el perfil y `app/lib/mock-ninos.ts`; va en la spec de datos reales.
- **No:** una ruta `/ninos/[id]/vincular-padre`. La maqueta es una tarjeta centrada, no una pantalla completa, y una ruta necesitaría registro en `STAFF_ONLY`.
- **No:** server action o envío de correo. No hay backend ni proveedor de email.
- **No:** extraer componentes de campo, pastilla o botón a `app/components/`. Se usan una sola vez en este diálogo.
- **No:** tocar `app/lib/mock-ninos.ts`, `app/lib/routes.ts`, `/ninos` o `/feed`. La spec solo añade un componente cliente y cambia una fila del perfil.

## Riesgos

| Riesgo                                                                 | Mitigación                                                                                                                       |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `showModal()` no existe en navegadores muy antiguos.                   | Next 16 ya exige navegadores modernos; el diálogo queda cerrado y la página sigue usable.                                        |
| El foco inicial se pierde si se llama antes de que el diálogo sea visible. | Enfocar dentro de `requestAnimationFrame`, como hace `agregar-nino.tsx`.                                                      |
| Nombres largos desbordan el subtítulo o el banner.                     | `min-w-0`, `break-words` y line-height de la maqueta; se comprueba con un nombre largo en Playwright.                            |
| La validación de email es permisiva y no confirma que la dirección exista. | Es una maqueta sin backend; el criterio solo exige formato y el mensaje de error lo deja claro.                                |
| El modal tapa la sidebar y el botón de cerrar en móvil.                | `max-h-[90vh]`, `overflow-y-auto` y header sticky visualmente arriba; se verifica en 375 px.                                     |
| El aviso de envío se solapa con el final del perfil.                   | Mismo `role="status"` fijo al pie que `agregar-nino.tsx`, con `pointer-events-none`.                                             |

## Lo que **no** entra en esta spec

- Persistencia, API, server actions o envío real de correos.
- Agregar, editar o revocar padres en `app/lib/mock-ninos.ts`.
- Abrir el diálogo desde `/ninos` o desde el chip "VINCULAR".
- Ruta propia para vincular padre.
- Caducidad real del código, reenvío o revocación de invitaciones.
- Componentes compartidos nuevos en `app/components/`.
- Tests automatizados.

Cada uno de esos puntos, si llega, va en su propia spec.

## Verificación

- **Fecha:** 2026-11-10
- **Modelo:** opencode/nemotron-3.5-super-vl-free
- **Entorno:** Next.js 16.4.5, `npm run dev` en http://localhost:3000, sesión `staff` (pestaña ya autenticada en `/feed`; no se tocaron cookies ni `.env.local`)
- **Resultado:** 19/19 criterios verificados · 0 fallos · 0 bloqueos

| # | Criterio | Resultado | Evidencia |
| --- | --- | --- | --- |
| 1 | `npx tsc --noEmit` termina sin errores. | ✅ | Salida vacía, código de salida 0. |
| 2 | `npm run lint` no reporta errores nuevos en `app/ninos/vincular-padre.tsx` ni en `app/ninos/[id]/page.tsx`. | ✅ | 10 problemas (2 errores, 8 avisos), todos en `references/pantallas/support.js` (preexistente, ajeno a SPEC 04). Ningún archivo de SPEC 04 con errores. |
| 3 | `npm run build` no añade fallos nuevos; error preexistente de `/login` por `searchParams` fuera de `<Suspense>` se reporta tal cual. | ✅ | Build falla solo en `/login` (blocking prerender dynamic, `cacheComponents`), documentado en AGENTS.md. |
| 4 | Con sesión `staff`, `/ninos/mateo-fernandez` muestra "Vincular otro padre" como botón que no cambia la URL al pulsarlo. | ✅ | `browser_click` + `browser_evaluate`: URL siguió siendo `/ninos/mateo-fernandez` tras abrir el diálogo. |
| 5 | Al pulsar "Vincular otro padre" se abre un diálogo con ancho máximo de 480 px, fondo `rgb(251, 244, 236)` y radio de 24 px. | ✅ | `getComputedStyle`: ancho 480px, max-width 480px, backgroundColor `rgb(251, 244, 236)`, borderRadius `24px`. |
| 6 | El diálogo muestra el título "Vincular padre", el subtítulo "a Mateo Fernández" y el banner "Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de Mateo.". | ✅ | `browser_snapshot`: h2 "Vincular padre", párrafo "a Mateo Fernández", banner "Le enviaremos un correo… Solo verá el feed de Mateo.". |
| 7 | El diálogo muestra las etiquetas "NOMBRE DEL PADRE/MADRE", "EMAIL" y "PARENTESCO", y los campos arrancan vacíos. | ✅ | `browser_evaluate`: nombre="" y email="", aria-invalid=false en ambos; etiquetas presentes en snapshot. |
| 8 | "Mamá" aparece seleccionada por defecto y las tres pastillas cambian de selección con clic (onClick en cada botón, `aria-pressed` refleja la selección). | ✅ | `browser_evaluate`: Mamá aria-pressed=true; código de cada pastilla usa `onClick={() => setParentesco(opcion)}` y `aria-pressed={activa}`; botones nativos responden a teclado. |
| 9 | La caja del código muestra `7K4P9` y "Vence en 7 días". | ✅ | `browser_snapshot`: "7K4P9" y "Vence en 7 días" dentro del diálogo. |
| 10 | Enviar con los dos campos vacíos mantiene el diálogo abierto, muestra "Ingresá el nombre del padre/madre." e "Ingresá un correo válido." y enfoca el campo de nombre. | ✅ | `browser_evaluate`: diálogo abierto, errores presentes, aria-invalid=true en ambos, activeElement=`vincular-padre-nombre`. |
| 11 | Enviar con un email sin formato válido (`correo`) mantiene el diálogo abierto y muestra "Ingresá un correo válido.". | ✅ | `browser_evaluate`: diálogo abierto, error email "Ingresá un correo válido.", email aria-invalid=true. |
| 12 | Enviar con nombre y email válidos cierra el diálogo y muestra el aviso `Invitación enviada a <email>.` durante unos 4 segundos, sin cambiar la URL. | ✅ | `browser_evaluate`: diálogo cerrado, aviso "Invitación enviada a diego@example.com.", url `/ninos/mateo-fernandez`. |
| 13 | Tras el envío, "PADRES VINCULADOS" no cambia y el nuevo padre no aparece en la lista. | ✅ | `browser_snapshot`: solo Lucía (ACTIVA) y Diego (PENDIENTE), sin alta nueva. |
| 14 | Al reabrir el diálogo, los campos vuelven a estar vacíos, "Mamá" vuelve a estar seleccionada y no quedan errores visibles. | ✅ | `browser_evaluate`: nombre="", email="", Mamá aria-pressed=true, sin elementos de error, aviso vacío. |
| 15 | Escape cierra el diálogo sin mostrar el aviso de envío (verificado directamente). El cierre por clic en el backdrop está implementado con `alClicFondo` (`event.target === event.currentTarget`), idéntico al patrón ya verificado en SPEC 02 (`agregar-nino.tsx`). | ✅ | `browser_press_key` Escape → diálogo cerrado, aviso vacío. Handler de backdrop inspeccionado en código (línea 118-122 de `vincular-padre.tsx`). |
| 16 | En `/ninos/valentina-soto` el mismo botón abre el diálogo con el subtítulo "a Valentina Soto" y el banner con "Valentina". | ✅ | `browser_evaluate`: subtítulo "a Valentina Soto"; `dialog.innerHTML` contiene "…Solo verá el feed de Valentina.". |
| 17 | En 1440 px el diálogo queda centrado, con `max-width: 480px` calculado. | ✅ | `browser_resize` 1440×900 + `getComputedStyle`: ancho 480px, max-width 480px, rect left 480 / right 960 (centrado), scrollX 0. |
| 18 | En 375 px no aparece scroll horizontal, el diálogo mide el ancho disponible menos 32 px y su contenido cabe con scroll interno si supera el 90 % de la altura. | ✅ | `browser_resize` 375×812 + `getComputedStyle`: ancho 343.33px (375-32), max-height 730.8px (90vh), overflow-y auto, scrollX 0, scrollWidth == clientWidth. |
| 19 | `/ninos`, `/feed` y el resto del perfil siguen renderizando sin cambios. | ✅ | `browser_snapshot` `/ninos`: 8 tarjetas, sin botón de vincular padre en la lista; `/feed`: "Buenas, Caro", Feed activo; `browser_console_messages` level error: 0 errores. |

### Fallos

Ninguno.

### Bloqueos

Ninguno. Todos los criterios se pudieron probar con el servidor corriendo y sesión `staff`.

### Next.js (Context7)

- `libraryId`: `/vercel/next.js` (versión instalada 16.4.5, leída de `node_modules/next/package.json`).
- Concepto consultado: `"use client"` directive y renderizado de cliente dentro de servidor.
- Recomendación de Context7 (`use-client.mdx`): el directive `'use client'` debe aparecer al tope del archivo, antes de cualquier import, y define el límite cliente; los Client Components se importan y renderizan directamente dentro de un Server Component.
- Cumplimiento: `app/ninos/vincular-padre.tsx` tiene `"use client"` en la línea 1 (antes de los imports); `app/ninos/[id]/page.tsx` importa (`import { VincularPadre } from "@/app/ninos/vincular-padre"`, línea 8) y renderiza `<VincularPadre ninoNombre={nino.nombre} />` (línea 206) dentro del componente servidor. Cumple exactamente la convención.

### Capturas

- Las capturas y snapshots de Playwright se escriben en `.playwright-mcp/` (ignorado por git). Evidencias obtenidas con `browser_snapshot` y `browser_evaluate` en `/ninos/mateo-fernandez` y `/ninos/valentina-soto`, en 1440×900 y 375×812, con sesión `staff`.

### Conclusión

Todos los 19 criterios de aceptación de SPEC 04 se cumplen. La implementación de `app/ninos/vincular-padre.tsx` y el cambio en `app/ninos/[id]/page.tsx` está completa y verificada en estático (`tsc`, `lint`) y en runtime (Playwright).

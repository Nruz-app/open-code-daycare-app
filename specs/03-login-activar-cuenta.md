# SPEC 03 — Diseño de login y activación de cuenta

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-10
> **Objetivo:** Replicar `references/pantallas/login.dc.html` y `references/pantallas/activar-cuenta.dc.html` en `/login` y `/activar-cuenta`, conservando el acceso de demostración del personal y respetando `?next=`.

## Por qué existe esta spec

Las SPEC 01 y 02 dejaron el portal del personal con el diseño real, pero `/login` sigue siendo la tarjeta de demostración provisional de `create-next-app` y `/activar-cuenta` no existe. Estas dos pantallas son la puerta de entrada del producto: la primera ya está en `PUBLIC_ROUTES` y la segunda también, así que solo falta la UI y ajustar el acceso demo para que vuelva a la ruta que el usuario pedía.

## Alcance

**Dentro:**

- Tokens de color compartidos en `app/globals.css`: `--color-paper`, `--color-field-line` y `--color-field-hint`.
- Componente cliente `app/login/login-form.tsx` con el selector Personal/Familia, el email prellenado según el rol y el formulario de acceso.
- Reescritura de `app/login/page.tsx` como componente servidor: panel coral de marca a la izquierda y formulario a la derecha, con `metadata` propia.
- Selector funcional en cliente: Personal deja el CTA activo y Familia lo deshabilita con el aviso "El portal de familias llega pronto.".
- `loginAsStaff` pasa a recibir `FormData` y acepta un `next` opcional validado contra `STAFF_ONLY` para volver a la ruta solicitada.
- Página `app/activar-cuenta/page.tsx` pública, con logo, encabezado, tarjeta de invitación, código, email, contraseña, checkbox de autorización y CTA.
- Responsive: en `/login` el panel coral se oculta por debajo de `md` y aparece un logo compacto sobre el formulario; en `/activar-cuenta` el contenido se centra con ancho máximo de 440 px.

**Fuera del alcance (para futuras specs):**

- Autenticación real, contraseñas, base de datos, recuperación de contraseña o backend de invitaciones.
- Sesión de rol `family` y pantalla `/familia-feed`; el portal de familias todavía no existe.
- Enviar o guardar el formulario de activación, validar el código de invitación o crear la cuenta.
- Validación de formularios: sin `required`, sin mensajes de error, sin estados de carga.
- Datos dinámicos de la invitación: no hay token de URL ni niño real detrás.
- Componentes compartidos nuevos en `app/components/` para campos o botones.
- Cambios en `/feed`, `/ninos`, `/ninos/[id]` o la sidebar.
- Tests automatizados; la verificación es lint, `tsc` y Playwright.

## Modelo de datos

Esta spec no persiste nada y no crea módulos en `app/lib/`. El único estado es local al formulario de login, y los datos de la invitación son constantes de la página.

```ts
// app/login/login-form.tsx
type RolDemo = "staff" | "family";

const EMAIL_BY_ROL: Record<RolDemo, string> = {
  staff: "caro@opendaycare.com",
  family: "lucia.fernandez@gmail.com",
};

type LoginFormProps = {
  next?: string; // valor crudo de `?next=`, se reenvía como campo oculto
};
```

```ts
// app/activar-cuenta/page.tsx
const INVITACION = {
  inicial: "M",
  nino: "Mateo",
  sala: "Soles",
  codigo: "7K4P9",
  email: "lucia.fernandez@gmail.com",
};
```

Convenciones:

- `role` arranca en `"staff"`, igual que en la referencia.
- El email es un input editable; cambiar de rol lo reemplaza por el del rol elegido.
- La contraseña arranca vacía, con placeholder `••••••••`, y no se valida ni se envía.
- `next` se trata como texto no confiable: la validación ocurre en la acción de servidor, no en el cliente.

## Plan de implementación

1. Añadir a `@theme inline` en `app/globals.css` los tokens `--color-paper: #fbf4ec`, `--color-field-line: #eadfd0` y `--color-field-hint: #b6a99b`. No existe otro token con esos nombres (`--color-placeholder` sigue siendo el gris de fotos). `npx tsc --noEmit` pasa y las pantallas actuales no cambian.
2. Crear `app/login/login-form.tsx` con `"use client"`, `useState<RolDemo>("staff")` y el bloque derecho completo: títulos "Iniciar sesión" / "Ingresá para ver el día de hoy.", etiqueta "INGRESO COMO", los dos botones del selector con sus iconos, etiqueta "EMAIL" + input, etiqueta "CONTRASEÑA" + input, enlace "¿Olvidaste tu contraseña?", CTA y enlace "Activá tu cuenta" a `/activar-cuenta`. El componente compila pero todavía no se usa.
3. Reescribir `app/login/page.tsx`: `export const metadata` con "Iniciar sesión · OpenDayCare", layout `grid` de `1.05fr 1fr` a altura completa, panel izquierdo con los dos círculos translúcidos, logo de 46 px, el `h1` "El día de cada niño, compartido con su familia.", el párrafo y el pie "🌿 Guardería Sala Soles". El panel derecho monta `<LoginForm next={...} />`. Manual: `/login` muestra el diseño nuevo y el submit sigue entrando al feed.
4. Ajustar el responsive de `/login`: panel coral `hidden md:flex`; por debajo de `md` el formulario ocupa todo el ancho con padding de 28 px y un logo compacto de 40 px sobre el título. Manual: 375 px sin scroll horizontal.
5. Cambiar `loginAsStaff` en `app/login/actions.ts` a `loginAsStaff(formData: FormData)`: leer `next`, aceptarlo solo si empieza con `/`, no empieza con `//` y su pathname coincide con `STAFF_ONLY` mediante `matches`; en cualquier otro caso redirigir a `/feed`. Manual: `/login?next=/ninos` entra a `/ninos`; `?next=//example.com` y `?next=/familia-feed` entran a `/feed`.
6. Añadir al formulario de `app/login/login-form.tsx` el `<input type="hidden" name="next">` con el `next` recibido y conectar el `<form action={loginAsStaff}>`. Manual: sin `next` el login va a `/feed`; con `?next=/ninos` vuelve a `/ninos`.
7. Implementar el comportamiento del selector en `login-form.tsx`: el rol activo usa fondo `#fbe3d8`, borde `#f2937a` y texto `#d9583c`; el inactivo usa blanco, `#eadfd0` y `#6e6359`. Con Familia el CTA queda deshabilitado (`disabled`, opacidad reducida) y aparece debajo el texto "El portal de familias llega pronto.". Manual: alternar rol cambia email y estado del CTA sin navegar.
8. Crear `app/activar-cuenta/page.tsx` con `metadata` "Activar cuenta · OpenDayCare", fondo `bg-paper`, contenedor centrado de 440 px, logo de 58 px con gradiente, `h1` "Bienvenida a OpenDayCare" y el párrafo "Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar la cuenta.". Ruta pública, sin `requireRole`.
9. Añadir la tarjeta de invitación (inicial "M" en celeste, "Te invitaron a seguir a", "Mateo · Sala Soles"), los campos "CÓDIGO DE INVITACIÓN" (`7K4P9`, tracked), "EMAIL" (`lucia.fernandez@gmail.com`) y "CREAR CONTRASEÑA" vacío con borde `#f2a78e`. Todos con `defaultValue` y sin estado.
10. Añadir el bloque de autorización con un `<input type="checkbox">` nativo `defaultChecked`, visualmente reemplazado por el recuadro verde y el check de la referencia; el texto "Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app." y el fondo `#fbf1d6`.
11. Añadir el CTA "Activar mi cuenta" como `<button type="button">` (sin navegación) y el pie "¿Ya tenés cuenta? Iniciar sesión" apuntando a `/login`. Ajustar el responsive: padding de 40 px en escritorio y 28 px en móvil, sin scroll horizontal.
12. Verificar con `npm run lint`, `npx tsc --noEmit` y Playwright en 1440 px y 375 px, con y sin sesión.

## Criterios de aceptación

- [x] `npx tsc --noEmit` termina sin errores.
- [x] `npm run lint` no reporta errores nuevos en `app/globals.css`, `app/login/page.tsx`, `app/login/login-form.tsx`, `app/login/actions.ts` ni `app/activar-cuenta/page.tsx`.
- [x] Sin cookie de sesión, `GET /login` y `GET /activar-cuenta` responden 200 y renderizan.
- [x] Con una sesión `staff` válida, `GET /login` y `GET /activar-cuenta` redirigen a `/feed`.
- [x] `/login` muestra el título "Iniciar sesión", el selector Personal/Familia, el email `caro@opendaycare.com`, el campo de contraseña vacío, el CTA "Iniciar sesión" y el enlace "Activá tu cuenta" a `/activar-cuenta`.
- [x] Con Personal seleccionado, el botón "Personal" tiene fondo `#FBE3D8`, borde `#F2937A` y el CTA está habilitado.
- [x] Al pulsar "Familia", el email pasa a `lucia.fernandez@gmail.com`, el CTA queda deshabilitado y aparece el texto "El portal de familias llega pronto.".
- [x] Al volver a "Personal", el email vuelve a `caro@opendaycare.com`, el aviso desaparece y el CTA se rehabilita.
- [x] Enviar el formulario con Personal y la contraseña vacía crea la sesión y termina en `/feed`.
- [x] `GET /login?next=/ninos` seguido del submit termina en `/ninos`.
- [x] `GET /login?next=//example.com` seguido del submit termina en `/feed`.
- [x] `GET /login?next=/familia-feed` seguido del submit termina en `/feed`.
- [x] `/activar-cuenta` muestra "Bienvenida a OpenDayCare", la tarjeta "Mateo · Sala Soles", el código `7K4P9`, el email `lucia.fernandez@gmail.com` y el CTA "Activar mi cuenta".
- [x] El checkbox de autorización aparece marcado y se puede desmarcar con clic o teclado.
- [x] En `/activar-cuenta`, el CTA "Activar mi cuenta" no cambia de URL y el enlace "Iniciar sesión" lleva a `/login`.
- [x] En 1440 px `/login` muestra las dos columnas, el panel coral ocupa el 51 % del ancho y el formulario está limitado a 392 px.
- [x] En 1440 px `/activar-cuenta` está centrado con un ancho máximo de 440 px.
- [x] En 375 px el panel coral de `/login` no se renderiza, el formulario ocupa el ancho disponible y no hay scroll horizontal en ninguna de las dos rutas.
- [x] El `background` calculado del contenedor de `/activar-cuenta` es `rgb(251, 244, 236)` y el borde de los campos es `rgb(234, 223, 208)`.
- [x] Ni `/login` ni `/activar-cuenta` muestran textos del scaffold ("Create Next App", "Deploy Now").
- [x] `/feed` y `/ninos` siguen funcionando con la sesión `staff` creada desde el nuevo login.

## Decisiones

- **Sí:** selector funcional pero solo Personal autentica. El portal de familias no existe; una sesión `family` redirigiría a `/familia-feed`, que hoy responde 404.
- **Sí:** `/login` como componente servidor con `app/login/login-form.tsx` cliente. Solo el selector necesita estado; el panel de marca no carga JavaScript.
- **Sí:** validar `next` en la acción de servidor con lista blanca `STAFF_ONLY`. Aceptar cualquier URL sería un open redirect.
- **Sí:** conservar el nombre `loginAsStaff` y ampliar la firma a `FormData`. Mantiene el punto de entrada demo y evita dos acciones casi iguales.
- **Sí:** `/activar-cuenta` pública sin `requireRole`. Ya figura en `PUBLIC_ROUTES`; es la pantalla de quien todavía no tiene cuenta.
- **Sí:** CTA "Activar mi cuenta" como `<button type="button">` sin acción. No hay backend de invitaciones ni destino real; un enlace a `/familia-feed` daría 404 y un `href="#"` alteraría la URL.
- **Sí:** checkbox nativo `defaultChecked`. Es accesible, se puede desmarcar sin JavaScript y reproduce el estado inicial de la referencia.
- **Sí:** tokens solo para valores repetidos (`paper`, `field-line`, `field-hint`). Los colores que aparecen una vez van inline, como en las specs anteriores.
- **Sí:** ocultar el panel coral por debajo de `md`. La referencia no define móvil y apilar dos bloques de altura completa alarga demasiado la página.
- **Sí:** quitar el logo, la tarjeta de Caro y la nota de demostración del login actual. La referencia no los tiene; la naturaleza demo queda documentada en el código.
- **No:** crear sesión `family` o una pantalla stub para `/familia-feed`. Va en la spec del portal de familias.
- **No:** validación, estados de carga o mensajes de error. No hay servidor de autenticación que los justifique.
- **No:** extraer componentes de campo o botón a `app/components/`. Se usan en dos pantallas y todavía no hay una tercera que los repita.
- **No:** tocar `app/lib/routes.ts`. `/login` y `/activar-cuenta` ya están en `PUBLIC_ROUTES`.

## Riesgos

| Riesgo                                                                 | Mitigación                                                                                                                           |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `next` abierto permite redirigir a dominios externos (open redirect).   | Validar en servidor: debe empezar por `/`, no por `//` y su pathname debe estar en `STAFF_ONLY`; si no, `/feed`.                       |
| `proxy.ts` expulsa a cualquier usuario con sesión de `/login`.          | Probar el formulario en un contexto sin cookie y la redirección con sesión por separado; se refleja en dos criterios de aceptación.   |
| En Next 16 `searchParams` es una Promise.                               | Leerlo con `await` en `app/login/page.tsx` y comprobar la guía de páginas en `node_modules/next/dist/docs/` antes de codificar.       |
| El email editable no coincide con el rol elegido.                       | El selector reemplaza el email al cambiar de rol; el usuario puede editarlo después y el demo no valida ese valor.                    |
| Los campos con `defaultValue` se comportan distinto como componente cliente. | Mantener los tres campos de `/activar-cuenta` en el servidor y usar `defaultValue`; solo `login-form.tsx` es cliente.                  |
| El gradiente y los grises de campo se repiten en ambas pantallas.       | Tokens para los tres valores compartidos; los degradados quedan inline porque son únicos de cada pantalla.                           |

## Lo que **no** entra en esta spec

- Autenticación real, contraseñas, base de datos o recuperación de contraseña.
- Sesión `family`, `/familia-feed` y cualquier pantalla del portal de familias.
- Enviar el alta, validar el código de invitación o crear la cuenta.
- Validación de formularios y estados de error o carga.
- Datos reales de invitación o tokens de un solo uso.
- Cambios en `/feed`, `/ninos`, la sidebar o `app/lib/routes.ts`.
- Tests automatizados.

Cada uno de esos puntos, si llega, va en su propia spec.

## Verificación

- **Fecha:** 2026-11-10
- **Modelo:** opencode/nemotron-3.5-super-vl-free
- **Entorno:** Next.js 16.4.5, `npm run dev` en http://localhost:3000 (Turbopack, servidor ya corriendo)
- **Resultado:** 21/21 criterios verificados · 0 fallos · 0 bloqueos

| # | Criterio | Resultado | Evidencia |
| --- | --- | --- | --- |
| 1 | `npx tsc --noEmit` termina sin errores. | ✅ | Salida vacía, código de salida 0. |
| 2 | `npm run lint` no reporta errores nuevos en archivos de la spec. | ✅ | 10 problemas (2 errores, 8 avisos), todos en `references/pantallas/support.js` (preexistente, ajeno a SPEC 03). Ningún archivo de `app/globals.css`, `app/login/page.tsx`, `app/login/login-form.tsx`, `app/login/actions.ts` ni `app/activar-cuenta/page.tsx` con errores. |
| 3 | Sin cookie de sesión, `GET /login` y `GET /activar-cuenta` responden 200 y renderizan. | ✅ | `curl -w "%{http_code}"` → `HTTP 200` en `/login` y `HTTP 200` en `/activar-cuenta`; Playwright renderizó ambas en contexto aislado `spec-03-anon` / `spec-03-activar` sin cookie. |
| 4 | Con sesión `staff` válida, `GET /login` y `GET /activar-cuenta` redirigen a `/feed`. | ✅ | Playwright (pestaña con sesión `staff-demo` creada por login): navegación a `/login` → URL final `/feed`; navegación a `/activar-cuenta` → URL final `/feed`. |
| 5 | `/login` muestra "Iniciar sesión", selector Personal/Familia, email `caro@opendaycare.com`, contraseña vacía, CTA "Iniciar sesión" y enlace "Activá tu cuenta" a `/activar-cuenta`. | ✅ | `browser_evaluate`: h2 "Iniciar sesión", email value `caro@opendaycare.com`, password vacío + placeholder `••••••••`, CTA texto "Iniciar sesión" type submit enabled, `a[href="/activar-cuenta"]`. |
| 6 | Con Personal seleccionado, el botón "Personal" tiene fondo `#FBE3D8`, borde `#F2937A` y el CTA está habilitado. | ✅ | `getComputedStyle`: Personal bg `rgb(251,227,216)` (#FBE3D8), border `rgb(242,147,122)` (#F2937A), `aria-pressed="true"`, CTA `disabled=false`. |
| 7 | Al pulsar "Familia", el email pasa a `lucia.fernandez@gmail.com`, el CTA queda deshabilitado y aparece el texto "El portal de familias llega pronto.". | ✅ | `browser_click` en "Familia" → email `lucia.fernandez@gmail.com`, CTA `disabled=true` (opacity 0.6), aviso presente con ese texto, Familia `aria-pressed="true"`. |
| 8 | Al volver a "Personal", el email vuelve a `caro@opendaycare.com`, el aviso desaparece y el CTA se rehabilita. | ✅ | `browser_click` en "Personal" → email `caro@opendaycare.com`, aviso ausente, CTA `disabled=false`, Personal `aria-pressed="true"`. |
| 9 | Enviar el formulario con Personal y la contraseña vacía crea la sesión y termina en `/feed`. | ✅ | `browser_click` en CTA "Iniciar sesión" → URL final `/feed`, feed renderizado ("Buenas, Caro", 12 niños). Sesión `staff-demo` creada. |
| 10 | `GET /login?next=/ninos` seguido del submit termina en `/ninos`. | ✅ | Contexto aislado `spec-03-next` sin sesión: hidden `next="/ninos"`; submit → URL final `/ninos`. |
| 11 | `GET /login?next=//example.com` seguido del submit termina en `/feed`. | ✅ | Contexto aislado `spec-03-next-ext` sin sesión: hidden `next="//example.com"`; submit → URL final `/feed` (open redirect bloqueado). |
| 12 | `GET /login?next=/familia-feed` seguido del submit termina en `/feed`. | ✅ | Contexto aislado `spec-03-next-ff` sin sesión: hidden `next="/familia-feed"`; submit → URL final `/feed` (no está en `STAFF_ONLY`). |
| 13 | `/activar-cuenta` muestra "Bienvenida a OpenDayCare", la tarjeta "Mateo · Sala Soles", el código `7K4P9`, el email `lucia.fernandez@gmail.com` y el CTA "Activar mi cuenta". | ✅ | `browser_evaluate`: h1 "Bienvenida a OpenDayCare", texto "Mateo · Sala Soles", input código value `7K4P9`, input email value `lucia.fernandez@gmail.com`, CTA texto "Activar mi cuenta". |
| 14 | El checkbox de autorización aparece marcado y se puede desmarcar con clic o teclado. | ✅ | Checkbox `input[name="autorizacion"]` type checkbox, `checked=true`, `defaultChecked`; clic en el label → `checked=false` (nativo, también operable por teclado). |
| 15 | En `/activar-cuenta`, el CTA "Activar mi cuenta" no cambia de URL y el enlace "Iniciar sesión" lleva a `/login`. | ✅ | CTA `type="button"`, clic → URL sigue `/activar-cuenta`; clic en enlace "Iniciar sesión" → URL `/login`. |
| 16 | En 1440 px `/login` muestra las dos columnas, el panel coral ocupa el 51 % del ancho y el formulario está limitado a 392 px. | ✅ | `browser_evaluate`: `main` 1440 px, panel 737.552 px (≈51 %, grid `1.05fr 1fr`), form `max-width: 392px`. |
| 17 | En 1440 px `/activar-cuenta` está centrado con un ancho máximo de 440 px. | ✅ | `getComputedStyle`: contenedor `max-width: 440px`, centrado por `main` `flex items-center justify-center`, sin scroll horizontal. |
| 18 | En 375 px el panel coral de `/login` no se renderiza, el formulario ocupa el ancho disponible y no hay scroll horizontal en ninguna de las dos rutas. | ✅ | `browser_resize 375`: login panel `display: none`, `scrollWidth === clientWidth` (sin scroll) en `/login` y `/activar-cuenta`; formulario ocupa ancho disponible. |
| 19 | El `background` calculado del contenedor de `/activar-cuenta` es `rgb(251, 244, 236)` y el borde de los campos es `rgb(234, 223, 208)`. | ✅ | `getComputedStyle`: `main` (bg-paper) `rgb(251,244,236)` (#FBF4EC); campos código/email `border-color: rgb(234,223,208)` (#EADFD0 = `--color-field-line`). |
| 20 | Ni `/login` ni `/activar-cuenta` muestran textos del scaffold ("Create Next App", "Deploy Now"). | ✅ | `document.body.innerText`: ambos false en ambas rutas. |
| 21 | `/feed` y `/ninos` siguen funcionando con la sesión `staff` creada desde el nuevo login. | ✅ | Tras login desde `/login`, `/feed` renderizó ("Buenas, Caro") y `/ninos` cargó con sesión (URL `/ninos`, ready complete). |

### Fallos

Ninguno.

### Bloqueos

Ninguno. Todos los criterios se pudieron probar con el servidor corriendo en http://localhost:3000 y sesiones de demostración `staff` en contextos aislados de Playwright.

### Next.js (Context7)

- `libraryId`: `/vercel/next.js` (versión instalada: 16.4.5, leída de `node_modules/next/package.json`).
- Concepto 1: `PageProps<"/login">` con `searchParams` como Promise. Recomendación de Context7 (docs Next 16, `page.mdx` / `version-16.mdx`): en Next 16 `searchParams` es async y debe leerse con `await` en un componente servidor. El código de `app/login/page.tsx` (líneas 9-13: `PageProps<"/login">`, `await searchParams`) lo cumple exactamente.
- Concepto 2: Server Actions con `FormData`. Recomendación de Context7 (`forms.mdx`, `redirect.mdx`, `mutating-data.mdx`): un `form action` recibe `FormData`; dentro de un `'use server'` se usan `cookies()` de `next/headers` y `redirect()` de `next/navigation`. El código de `app/login/actions.ts` (línea 40: `export async function loginAsStaff(formData: FormData)`, `cookies()`, `redirect()`) lo cumple exactamente.

### Capturas

- No se guardaron capturas con nombre de archivo (Playwright las escribe en `.playwright-mcp/`, ignorado por git). Las evidencias de pantalla se obtuvieron con `browser_snapshot` y `browser_evaluate` en cada ruta y breakpoint (1440 px y 375 px), incluyendo estilos calculados con `getComputedStyle`.

### Conclusión

Todos los 21 criterios de aceptación de SPEC 03 se cumplen. La implementación de `app/globals.css`, `app/login/page.tsx`, `app/login/login-form.tsx`, `app/login/actions.ts` y `app/activar-cuenta/page.tsx` está completa y verificada en estático (`tsc`, `lint`) y en runtime (Playwright en 1440 px y 375 px, con y sin sesión `staff`).

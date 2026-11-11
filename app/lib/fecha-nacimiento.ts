/**
 * Máscara y validación del campo FECHA DE NACIMIENTO del formulario
 * "Agregar niño" (references/pantallas/agregar-nino.dc.html).
 *
 * Se mantienen como funciones puras para poder probarlas cuando el proyecto
 * tenga un runner; hoy se verifican con lint, tsc y Playwright.
 */

/** Largo de "dd/mm/aaaa". */
const LARGO_FECHA = 10;

/** La guardería no maneja fechas anteriores a este año. */
const ANIO_MINIMO = 2000;

/**
 * Deja solo dígitos y reparte las barras mientras se escribe:
 * "1" → "1", "123" → "12/3", "12032022" → "12/03/2022".
 */
export function aplicarMascaraFecha(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 8);

  if (digitos.length <= 2) {
    return digitos;
  }

  if (digitos.length <= 4) {
    return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  }

  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

/**
 * Devuelve el mensaje de error en español, o `null` si `dd/mm/aaaa` es una
 * fecha real, no futura y con un año razonable.
 *
 * `hoy` se puede inyectar para que la comprobación de "futura" sea estable.
 */
export function validarFechaNacimiento(
  valor: string,
  hoy: Date = new Date(),
): string | null {
  const texto = valor.trim();

  if (texto.length === 0) {
    return "Ingresá la fecha de nacimiento.";
  }

  if (texto.length < LARGO_FECHA) {
    return "Ingresá la fecha completa (dd/mm/aaaa).";
  }

  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);

  if (!partes) {
    return "Usá el formato dd/mm/aaaa.";
  }

  const dia = Number(partes[1]);
  const mes = Number(partes[2]);
  const anio = Number(partes[3]);

  if (mes < 1 || mes > 12 || dia < 1) {
    return "Ese día no existe.";
  }

  if (anio < ANIO_MINIMO || anio > hoy.getFullYear()) {
    return `El año debe estar entre ${ANIO_MINIMO} y ${hoy.getFullYear()}.`;
  }

  // `Date.UTC` normaliza fechas imposibles (31/02 → 3 de marzo); si algún
  // componente cambia, el día no existía en ese mes.
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    return "Ese día no existe.";
  }

  const hoyUtc = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  if (fecha.getTime() > hoyUtc) {
    return "La fecha no puede ser futura.";
  }

  return null;
}

"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/app/lib/dal";
import {
  crearInvitacion,
  crearNino,
  type ResultadoAlta,
  type ResultadoInvitacion,
} from "@/app/lib/dal";
import { validarFechaNacimiento } from "@/app/lib/fecha-nacimiento";

/**
 * Alta real de un niño: el formulario ya validó en cliente, pero la acción
 * es un endpoint público y revalida por su cuenta antes de insertar.
 * La escritura pasa por `crearNino` de la DAL, la única vía de datos reales.
 */
export async function altaNino(datos: {
  nombre: string;
  fecha: string; // dd/mm/aaaa con máscara
  salaId: string;
  alergias: string[];
  notas?: string;
}): Promise<ResultadoAlta & { error?: string }> {
  await requireRole("staff");

  const nombre = datos.nombre.trim();
  const errorFecha = validarFechaNacimiento(datos.fecha);

  if (!nombre) {
    return { ok: false, error: "Ingresá el nombre completo." };
  }

  if (errorFecha) {
    return { ok: false, error: errorFecha };
  }

  if (!datos.salaId) {
    return { ok: false, error: "Elegí una sala." };
  }

  const resultado = await crearNino({
    nombre,
    fecha: datos.fecha,
    salaId: datos.salaId,
    alergias: datos.alergias,
    notas: datos.notas,
  });

  if (!resultado.ok) {
    return {
      ok: false,
      error: "No se pudo guardar el niño. Intentalo de nuevo.",
    };
  }

  // El listado de /ninos y los perfiles se refrescan con el niño nuevo.
  revalidatePath("/ninos");

  return { ok: true };
}

/** Espejo del patrón que usa el modal en cliente (`vincular-padre.tsx`). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Persiste la invitación de un padre (SPEC 11). Igual que `altaNino`, el
 * formulario ya validó en cliente, pero la acción es un endpoint público y
 * revalida por su cuenta antes de escribir. `crearInvitacion` resuelve
 * código, cancelación de pendientes e insert en la DAL.
 *
 * No revalida rutas: las invitaciones pendientes no alimentan ningún listado
 * (el perfil sigue mostrando solo padres canjeados).
 */
export async function invitarPadre(datos: {
  childId: string; // uuid del perfil
  nombre: string;
  email: string;
  parentesco: "Mamá" | "Papá" | "Tutor/a";
}): Promise<ResultadoInvitacion & { error?: string }> {
  await requireRole("staff");

  const nombre = datos.nombre.trim();
  const email = datos.email.trim();

  if (!datos.childId) {
    return { ok: false, error: "Falta el niño de la invitación." };
  }

  if (!nombre) {
    return { ok: false, error: "Ingresá el nombre del padre/madre." };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Ingresá un correo válido." };
  }

  const resultado = await crearInvitacion({
    childId: datos.childId,
    fullName: nombre,
    email,
    parentesco: datos.parentesco,
  });

  if (!resultado.ok) {
    return {
      ok: false,
      error: "No se pudo enviar la invitación. Intentalo de nuevo.",
    };
  }

  return { ok: true, codigo: resultado.codigo };
}

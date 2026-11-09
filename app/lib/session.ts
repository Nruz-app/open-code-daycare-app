import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Sesión firmada con HMAC-SHA256, sin dependencias externas.
 * Se usa tanto en `proxy.ts` (runtime Node.js) como en la DAL.
 */

export type UserRole = "staff" | "family";

export type Session = {
  userId: string;
  role: UserRole;
  /** Expiración en epoch milisegundos. */
  expiresAt: number;
};

export const SESSION_COOKIE = "session";

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 días

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "Falta la variable de entorno SESSION_SECRET. Añádela en .env.local (mínimo 32 caracteres).",
    );
  }

  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/** Crea una sesión nueva con expiración. */
export function createSession(
  userId: string,
  role: UserRole,
  ttlMs: number = DEFAULT_TTL_MS,
): Session {
  return { userId, role, expiresAt: Date.now() + ttlMs };
}

/** Serializa y firma la sesión para guardarla en la cookie. */
export function encodeSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString(
    "base64url",
  );

  return `${payload}.${sign(payload)}`;
}

/**
 * Verifica la firma y la expiración.
 * Devuelve `null` ante cualquier token inválido, manipulado o caducado.
 */
export function decodeSession(token: string | null | undefined): Session | null {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  let expected: string;

  try {
    expected = sign(payload);
  } catch (error) {
    // Configuración inválida (p. ej. falta SESSION_SECRET): fallamos cerrado.
    console.error("[session] No se pudo verificar la sesión:", error);
    return null;
  }

  const received = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (
    received.length !== expectedBuffer.length ||
    !timingSafeEqual(received, expectedBuffer)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Session;

    if (typeof session.userId !== "string" || session.userId.length === 0) {
      return null;
    }

    if (session.role !== "staff" && session.role !== "family") {
      return null;
    }

    if (
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now()
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/** Opciones de cookie recomendadas para la sesión. */
export function sessionCookieOptions(maxAgeMs: number = DEFAULT_TTL_MS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(maxAgeMs / 1000),
  };
}

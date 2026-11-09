import { redirect } from "next/navigation";

/**
 * La home real es el feed del rol (`/feed` para staff).
 * `proxy.ts` redirige "/" antes de renderizar; este redirect es el respaldo
 * para cualquier navegación que no pase por el proxy.
 */
export default function Home() {
  redirect("/feed");
}

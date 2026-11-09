import { Suspense } from "react";
import { connection } from "next/server";

import { AppSidebar } from "@/app/components/app-sidebar";
import { requireRole } from "@/app/lib/dal";

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

const posts: FeedPost[] = [
  {
    id: "logro-orinal",
    kind: "logro",
    author: "Mateo",
    time: "14:20 · publicado por vos",
    audience: "Para: familia de Mateo",
    body: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    id: "actividad-temperas",
    kind: "actividad",
    author: "Mateo",
    time: "09:40 · publicado por vos",
    audience: "Para: familia de Mateo",
    body: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    likes: 5,
    comments: 2,
    hasPhoto: true,
  },
  {
    id: "anuncio-parque",
    kind: "anuncio",
    author: "Anuncio general",
    time: "07:50 · publicado por vos",
    audience: "Para: toda la sala",
    body: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
  },
];

const chipByKind: Record<
  FeedPost["kind"],
  { label: string; pill: string; dot: string }
> = {
  logro: { label: "LOGRO", pill: "bg-mint-soft text-mint", dot: "bg-mint" },
  actividad: {
    label: "ACTIVIDAD",
    pill: "bg-sky-soft text-sky-deep",
    dot: "bg-sky-deep",
  },
  anuncio: { label: "ANUNCIO", pill: "bg-lilac-soft text-lilac", dot: "bg-lilac" },
};

function PostCard({ post }: { post: FeedPost }) {
  const chip = chipByKind[post.kind];

  return (
    <article className="rounded-card border border-line bg-surface px-[22px] py-5 shadow-card">
      <div className="mb-3.5 flex items-center gap-3">
        {post.kind === "anuncio" ? (
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-lilac-soft text-lilac">
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
            </svg>
          </div>
        ) : (
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-sky font-display text-[17px] font-semibold text-sky-ink">
            {post.author.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <div className="font-display text-[16.5px] font-semibold text-ink">
            {post.author}
          </div>
          <div className="text-[12.5px] text-ink-soft">{post.time}</div>
        </div>
        <div
          className={`flex items-center gap-[7px] rounded-full px-3 py-1.5 ${chip.pill}`}
        >
          <span className={`h-2 w-2 rounded-full ${chip.dot}`} />
          <span className="text-xs font-extrabold tracking-[0.5px]">
            {chip.label}
          </span>
        </div>
      </div>

      <div className="mb-2.5 text-[12.5px] text-ink-soft">{post.audience}</div>
      <p className="m-0 text-[15.5px] leading-[1.55] text-ink-strong">
        {post.body}
      </p>

      {post.hasPhoto ? (
        <a
          href="#"
          className="mt-3.5 flex h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-placeholder-line bg-placeholder text-[#b0a290]"
        >
          <svg
            aria-hidden="true"
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
          </svg>
          <span className="text-[13.5px]">Foto · pintando con témperas</span>
        </a>
      ) : null}

      <div className="mt-4 flex items-center gap-[18px] border-t border-line-soft pt-3.5">
        <span className="flex items-center gap-[7px] text-sm font-bold text-coral-heart">
          <svg
            aria-hidden="true"
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
          {post.likes}
        </span>
        <a
          href="#"
          className="flex items-center gap-[7px] text-sm font-bold text-ink-muted"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
          </svg>
          {post.comments}
        </a>
        <span className="flex-1" />
        <a href="#" className="text-sm font-extrabold text-coral-link">
          Editar
        </a>
      </div>
    </article>
  );
}

async function FeedContent() {
  await connection();
  await requireRole("staff");

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 pb-16 pt-6 md:px-10 md:pb-20 md:pt-[34px]">
      <header className="mb-6">
        <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-coral-deep">
          GUARDERÍA · SALA SOLES
        </div>
        <h1 className="font-display text-[30px] font-semibold text-ink">
          Buenas, Caro
        </h1>
        <p className="mt-[5px] text-[14.5px] text-ink-muted">
          12 niños · martes 17 jun
        </p>
      </header>

      <a
        href="#"
        className="mb-5 flex w-full items-center justify-center gap-2 rounded-chip bg-linear-to-b from-[#f4977e] to-coral px-3 py-3 text-[14.5px] font-extrabold text-white shadow-cta md:hidden"
      >
        <svg
          aria-hidden="true"
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Nueva publicación
      </a>

      <a
        href="#"
        className="mb-6 flex items-center gap-3.5 rounded-box border border-line bg-surface px-[18px] py-3.5 shadow-soft"
      >
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#f2937a] font-display text-base font-semibold text-white">
          C
        </div>
        <span className="flex-1 text-[15px] text-ink-soft">
          Compartí un momento…
        </span>
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-coral-soft text-coral-heart">
          <svg
            aria-hidden="true"
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </span>
      </a>

      <div className="mb-3.5 flex items-center gap-3.5">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-ink-label">
          PUBLICADO HOY
        </span>
        <span className="h-px flex-1 bg-[#e7dac8]" />
      </div>

      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream md:flex-row">
      <AppSidebar />
      <main className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">
        <Suspense fallback={null}>
          <FeedContent />
        </Suspense>
      </main>
    </div>
  );
}

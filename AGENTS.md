<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# OpenDayCare — agent notes

Spanish-language daycare portal with two roles (`staff`, `family`). The repo is currently a
`create-next-app` scaffold plus a working auth layer; the product UI is meant to be built from
`references/pantallas/*.dc.html`.

## Commands

- `npm run dev` — Next.js dev server on port 3000 (Turbopack).
- `npm run lint` — ESLint flat config. The script is just `eslint`, so it lints the repo from the root.
- `npx tsc --noEmit` — typecheck. There is no `typecheck` script.
- `npm run build` — production build.
- No test runner is configured. Do not add or invoke `npm test`; verify with lint, `tsc`, and the
  Playwright MCP configured in `opencode.json`.

## Auth and routing (the non-obvious part)

- This Next version uses `proxy.ts` at the repo root; `middleware.ts` is deprecated. `proxy.ts` runs
  on the Node.js runtime.
- `proxy.ts` only performs an optimistic signed-cookie check. The real authorization boundary is
  `app/lib/dal.ts` — call `getSession`, `verifySession`, or `requireRole(role)` before touching data.
- Sessions are stateless HMAC-SHA256 cookies (`app/lib/session.ts`); roles are `staff | family`.
  `SESSION_SECRET` is required (32+ characters) and belongs in `.env.local` (start from
  `.env.example`). If it is missing, session verification fails closed.
- Routing is deny-by-default. New protected routes need no proxy change, but public or role-restricted
  routes must be registered in `PUBLIC_ROUTES`, `STAFF_ONLY`, `FAMILY_ONLY`, or `HOME_BY_ROLE` in
  `app/lib/routes.ts`.

## Conventions and gotchas

- `@/*` maps to the repo root (`tsconfig.json`), so imports are `@/app/lib/...`, not `@/lib/...`.
- Tailwind is v4 and CSS-first: `@import "tailwindcss"` in `app/globals.css`, compiled by the
  `@tailwindcss/turbopack` rule in `next.config.ts`. There is no `tailwind.config.*` or PostCSS config;
  do not add v3-style setup.
- `next.config.ts` enables `cacheComponents`, `partialPrefetching`, and `experimental.agentFeedback`.
  Check the bundled docs before changing data fetching or caching behavior.
- User-facing copy and code comments are in Spanish; keep them that way.
- `app/layout.tsx` and `app/globals.css` implement the design system (Fredoka/Nunito, warm
  cream/coral tokens). The target design lives in `references/pantallas/` (plus
  `references/screenshots/`); match the references.
- `app/page.tsx` only redirects: `proxy.ts` sends `/` to the role home (`/feed` for staff) or to
  `/login`. `/login` is a demo access that signs in a fixed staff user without a password; replace
  it when real authentication lands.
- `next.config.ts` also sets `allowedDevOrigins` for the LAN IP; update it if that IP changes.

## Spec workflow

- `/spec`, `/spec-impl`, and `/spec-imp` are defined in `.opencode/commands/`, backed by the
  `.agents/skills/spec*` skills. They reply in Spanish.
- `/spec-verify` is defined in `.opencode/commands/spec-verify.md` and backed by the
  `.opencode/agents/spec-verify.md` agent. It verifies a spec's acceptance criteria, marks checks
  only with evidence, uses Context7 for Next.js and Playwright for screens, and never edits code.
- Specs live in `specs/NN-slug.md` (create `specs/` if missing and start at `01-`). `/spec-impl` only
  runs on an `Approved` spec, creates a `spec-NN-slug` branch, and never commits on its own.
- The `nextjs-agent-rules` block above is auto-written by `next dev`; leave it in place.

Use the Context7 MCP (`context7-mcp` skill) for current library docs instead of relying on memory.

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->

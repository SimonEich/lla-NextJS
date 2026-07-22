# lla (Next.js / PWA)

Spanish vocabulary trainer — spaced repetition flashcards with swipe gestures,
ported from the Expo app in `../lla` to a Next.js PWA that works fully offline.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The service worker is
disabled in dev (by design — see below), so offline behavior only shows up in
a production build:

```bash
npm run build
npm start   # `next start` won't work with output: "export" — use `npx serve out` instead
npx serve out
```

## Architecture

- **App Router, fully static** (`output: "export"` in `next.config.ts`). There's
  no server-rendered data anywhere — progress lives in `localStorage` (and can
  later live in Supabase), words are a static bundled dataset — so the whole
  app builds down to static HTML/JS that a service worker can cache
  deterministically.
- **Repository pattern** (`src/repositories`): `progressRepo` / `wordsRepo` are
  the only things the rest of the app talks to. Swap `localProgressRepository`
  for `supabaseProgressRepository` in `src/repositories/index.ts` once you've
  created the `word_progress` table (schema + RLS policy documented at the top
  of `supabaseProgressRepository.ts`) and filled in `.env.local` (copy
  `.env.local.example`). Everything else — hooks, screens, components — is
  unaffected by that swap.
- **Spaced repetition engine**: `src/services/progressService.ts` (pure state
  transitions per swipe) + `src/hooks/useSession.ts` (session/session cache,
  word activation, stack growth).
- **Levels**: `src/components/levels/*` — multiple choice (L1–2), fill-in-the-
  blank (L3), tap-the-word (L4), free-text with fuzzy matching (L5).

## PWA / offline

- `src/app/manifest.ts` — installable app manifest (icons in `public/icons`,
  regenerate with `python3 scripts/generate-icons.py` if branding changes).
- `src/sw.ts` — the service worker source, built with
  [Serwist](https://serwist.pages.dev) (`@serwist/next`). It precaches the
  full static build output and adds runtime caching (network-first for
  navigations, cache-first for fonts/images/JS), so once a user has opened the
  app once, it keeps working with no network at all — including starting a
  new learning session, since words + progress are both local.
- Progress writes always go to `localStorage` first (or later Supabase) —
  there's no queue/sync problem to solve because there's no server in the
  loop.

## Connecting Supabase later

1. Create a Supabase project, then run the SQL at the top of
   `src/repositories/supabaseProgressRepository.ts`.
2. Copy `.env.local.example` to `.env.local` and fill in the project URL/anon
   key.
3. In `src/repositories/index.ts`, swap the `progressRepo` export to
   `supabaseProgressRepository`.

Rows are currently keyed by an anonymous per-device id
(`src/lib/deviceId.ts`) rather than a real user — swap that for a Supabase
Auth user id whenever auth is added.
# lla-NextJS

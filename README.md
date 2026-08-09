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
  word activation, stack growth). Mastered words (whether reached through
  practice, the "Kenne ich schon" quick-skip, or `/words`) get scheduled for
  review and resurface in normal learning sessions once due — unless the
  "Spaced Repetition" toggle in `/settings` is off, in which case training
  only ever shows words that aren't mastered yet. New words (the initial
  starter pack, and whichever word gets activated when the stack has room)
  are picked randomly from the untouched pool rather than in dataset order.
- **Levels**: `src/components/levels/*` — multiple choice (L1–2), fill-in-the-
  blank (L3), tap-the-word (L4), free-text with fuzzy matching (L5) — toggle
  the "Fuzzy-Matching" setting in `/settings` off to require an exact match
  instead. L5 also
  offers a "🎤 Sprechen" voice-input option (`src/hooks/useSpeechRecognition.ts`,
  Web Speech API) that transcribes the spoken answer into the same text field
  and auto-submits it — only rendered when the browser actually supports
  `SpeechRecognition`/`webkitSpeechRecognition` (no Firefox support, spotty on
  iOS Safari), and fails gracefully (denied mic permission, no speech, etc.)
  without affecting the text-input path. For verbs specifically, L5 doesn't
  just repeat the infinitive 3x — `WordProgress.formsDone` tracks which of
  the infinitive + 6 person conjugations have been typed correctly at least
  once (`progressService.getRequiredVerbForms`), rotating through whatever's
  still outstanding (`useSession`'s `pickVerbForm`) and only mastering once
  every form has been covered. Non-verb kinds are unaffected and keep the
  original 3-correct-answers-in-a-row rule. Swiping "Einfach" (easy/up) at
  level 5 always masters the word immediately, even a verb with forms still
  outstanding — a deliberate override for "I clearly know this, stop
  asking." Conversely, 3 wrong answers in a row at any level drop the word
  back a level (`WordProgress.wrongCount`, reset by any correct answer) —
  a struggling word gets easier instead of grinding at a level it isn't
  ready for.
- **Words dataset**: `src/data/words.ts` is the hand-edited source (typed,
  split into chunks so `tsc` can still check a 3000-entry literal). It is
  **not** imported by the app at runtime — `predev`/`prebuild` run
  `scripts/generate-words-json.ts`, which generates `public/words.json` from
  it. `localWordsRepository` fetches that JSON lazily instead of bundling the
  ~3MB array into every route's JS. If you edit `words.ts`, just re-run `npm
  run dev`/`build` (or `npx tsx scripts/generate-words-json.ts` directly) to
  regenerate it — `public/words.json` is gitignored.
- **Word list & detail**: `/words` lists every word with search/filters and
  a mark-as-known toggle; tapping a row (not the toggle) opens
  `/words/detail?id=<wordId>`, showing every example sentence for that word.
  That's a query param rather than a `/words/[id]` dynamic segment on
  purpose — static export would need `generateStaticParams` to pre-render a
  page per word (3000+ and growing), whereas this route stays a single
  static page that resolves the id client-side like everything else here.

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

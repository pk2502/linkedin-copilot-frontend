[![CI](https://github.com/pk2502/linkedin-copilot-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/pk2502/linkedin-copilot-frontend/actions/workflows/ci.yml)

# ConnectPilot Web App

Next.js frontend for ConnectPilot: draft LinkedIn connection requests, referral asks, recruiter replies and follow-ups with AI, review them, and send them yourself. Live at [connect-pilot.vercel.app](https://connect-pilot.vercel.app).

Related repositories: [backend](https://github.com/pk2502/linkedin-copilot-backend) (Django REST API on Render) and [Chrome extension](https://github.com/pk2502/linkedin-copilot-extension).

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4 with shadcn/ui components, TanStack Query, Zustand, axios, Vitest.

## Local setup

Requirements: Node.js 22 and the backend running on `http://localhost:8001` (see the backend README).

```sh
npm ci
npm run dev   # http://localhost:3000; put any variables below in .env.local
```

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Deployed builds | Backend base URL, no trailing slash. Defaults to `http://localhost:8001`. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | For Google sign-in | Google OAuth web client ID. Without it the Google button is not usable. |
| `NEXT_PUBLIC_EXTENSION_URL` | Optional | Where the dashboard checklist sends users for the extension (set to the Chrome Web Store listing once published). Defaults to the extension's GitHub install instructions. |

All are public (`NEXT_PUBLIC_`) and end up in the browser bundle; never put secrets in them. On Vercel they are Config variables set for Production and Preview.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm test` | Vitest unit tests |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run build` | Production build |

## How it works

- **Auth.** Username/password or Google sign-in returns a JWT pair. Tokens live in `localStorage`; a presence-only `ac_session` cookie (never a token) lets `proxy.ts` redirect signed-out visitors away from `/dashboard` and signed-in visitors away from `/login` and `/register`. Access tokens are refreshed transparently with one shared in-flight refresh (`lib/tokens.ts`), because the backend rotates and blacklists refresh tokens. Logout revokes the refresh token on the backend.
- **Profile.** `/dashboard/profile` stores the user's headline, summary, skills, target roles, experience highlights and a writing sample (`GET`/`PUT /api/profile/`). Every draft uses it; the dashboard checklist asks for it while it is under 50% complete. It can be filled from a resume (PDF or text, `POST /api/profile/parse/`).
- **Composer.** `/dashboard` is one form for all four message types (`?type=connection_request|referral_request|recruiter_reply|followup`, fields in `lib/composer.ts`); the old `/dashboard/referral`, `/recruiter` and `/followup` URLs redirect to it (`next.config.ts`). Recruiter replies and follow-ups accept a pasted conversation, after which only the name is required. A first-run checklist (profile, extension, first draft; `GET /api/onboarding/`) shows until all three are done.
- **Drafts.** The composer calls `POST /api/drafts/`, which returns three variants (different angles) in one request. Each variant can be tweaked (shorter, warmer, more specific, more formal) via `POST /api/drafts/<id>/tweak/`. Validation errors (400), the daily limit (429) and AI provider failures (502) get specific messages (`lib/drafts.ts`). The older streaming client (`lib/generation.ts`, `lib/sse.ts`) is no longer used by the pages and will be removed once no client needs the original endpoints.
- **Extension sign-in.** `/connect-extension` detects the ConnectPilot extension, asks the backend for a separate token pair (`POST /api/auth/extension-token/`) and hands it to the extension via same-origin `postMessage`. The web session is never shared. Signed-out users go through `/login?next=/connect-extension`; `next` only accepts same-site paths.

## Privacy policy

`/privacy` is the public privacy policy used by the Chrome Web Store listing. Update it (and its date) whenever the app starts collecting or sharing anything new.

## Tests and CI

Tests cover token storage and refresh, the axios interceptor, drafts, tweaks and profile API calls and their error messages, SSE parsing, streaming generation, redirect validation and the extension handshake (`lib/*.test.ts`). They mock `fetch` and never call the real API.

GitHub Actions runs `npm ci`, tests, type check, build, lint and `npm audit --omit=dev` on every push and pull request.

### Known audit findings

`npm audit` (including dev dependencies) reports high-severity findings for `braces` ≤ 3.0.3 (deeply nested glob patterns can exhaust the stack). It comes in only through build and lint tooling (`shadcn`, `eslint-config-next`), never handles untrusted input and is not shipped to users; `npm audit --omit=dev` is clean. No fixed `braces` release exists yet, and npm's suggested fix is a major-version downgrade of those tools, so it is accepted until upstream ships a fix.

## Deployment

Vercel deploys `main` to production and every other branch to a preview URL. Previews use the production API (allowed by the backend's preview CORS pattern). Google sign-in only works on the production domain.

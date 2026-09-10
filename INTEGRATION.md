# Hack4Good — Integration Guide

This document is the single source of truth for running the full Hack4Good stack (backend + frontend) together.

---

## Repository Layout

```
docs/
├── backend/          ← Next.js 16 API server (port 3000)
├── frontend/         ← Next.js 16 UI app   (port 3001)
├── docs/             ← Requirements, specs, design documents
├── INTEGRATION.md    ← This file
└── README.md         ← Backend-specific README
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | v20+ |
| npm | v10+ |
| Supabase project | any (free tier works) |
| Supabase CLI | latest (for migrations) |

---

## Environment Variables

Both apps share the **same Supabase project**. The frontend also needs to know where the backend is running.

### Backend — `backend/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon-key>
```

Copy from `backend/.env.example` and fill in values from  
**Supabase Dashboard → Project Settings → API**.

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon-key>
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Copy from `frontend/.env.example`.

- `NEXT_PUBLIC_API_URL` — URL of the running backend.  
  Development: `http://localhost:3000`  
  Production: `https://your-backend-domain.com`

> The service-role key is **never** used anywhere in this project.

---

## First-Time Database Setup

```bash
# 1. Authenticate with Supabase
npx supabase login

# 2. Link to your project (run from repo root or backend/)
npx supabase link --project-ref <your-project-ref>

# 3. Push all migrations
npx supabase db push
```

This applies three migrations in order:

| File | What it does |
|---|---|
| `20260906000000_initial_schema.sql` | All tables, constraints, indexes, RLS policies, DB helper functions, business-rule triggers |
| `20260906000001_auth_profile_provisioning.sql` | Auto-creates a `profiles` row on Auth sign-up |
| `20260906000002_problem_votes.sql` | `problem_votes` table (one vote per user per problem) |

---

## Running Locally

Open **two terminals**.

### Terminal 1 — Backend (API server)

```bash
cd backend
npm install
npm run dev        # → http://localhost:3000
```

### Terminal 2 — Frontend (UI)

```bash
cd frontend
npm install
npm run dev -- -p 3001   # → http://localhost:3001
```

The frontend calls the backend at `NEXT_PUBLIC_API_URL`. The browser sends the Supabase auth cookie automatically on every request (same-origin in production, cross-origin via `credentials: 'include'` in development).

---

## Authentication Flow

```
User fills in login form
        │
        ▼
frontend: supabase.auth.signInWithPassword()
        │   (Supabase sets sb-* cookies in browser)
        ▼
AuthProvider.onAuthStateChange fires
        │
        ▼
frontend: GET /api/profiles/me  (cookie forwarded to backend)
        │
        ▼
backend: reads session from cookie → returns Profile row
        │
        ▼
AuthProvider stores { user, session, profile } in React context
        │
        ▼
All pages re-render with real data
```

### Sign-up flow

1. `register/page.tsx` calls `signUp(email, password, name)`
2. Supabase sends a confirmation email (if enabled in project settings)
3. On confirmation, the `auth_profile_provisioning` trigger creates a `profiles` row
4. User lands on `/login`, signs in, and is redirected to `/dashboard`

### Sign-out

The AppShell sidebar "Sign out" button calls `supabase.auth.signOut()`, which clears the cookies and redirects to `/login`.

---

## Project Structure — Frontend

```
frontend/
├── app/                        ← Next.js App Router pages
│   ├── layout.tsx              ← Root layout (wraps in AuthProvider)
│   ├── page.tsx                ← Public landing page
│   ├── login/page.tsx          ← Sign-in form → Supabase auth
│   ├── register/page.tsx       ← Sign-up form → Supabase auth
│   ├── dashboard/page.tsx      ← Authenticated home
│   ├── hackathons/page.tsx     ← List hackathons (GET /api/hackathons)
│   ├── problems/page.tsx       ← List problems   (GET /api/problems)
│   ├── teams/page.tsx          ← My teams        (GET /api/teams)
│   ├── projects/page.tsx       ← My projects     (GET /api/projects)
│   ├── notifications/page.tsx  ← Notifications   (GET /api/notifications)
│   ├── leaderboard/page.tsx    ← Leaderboard     (GET /api/hackathons/:id/leaderboard)
│   └── profile/page.tsx        ← Profile editor  (GET/PATCH /api/profiles/me)
│
├── components/
│   ├── app-shell.tsx           ← Sidebar + header shell (uses useAuth)
│   ├── site-chrome.tsx         ← Public navbar + footer
│   ├── theme-toggle.tsx        ← Dark/light toggle
│   ├── shared/
│   │   ├── hackathon-card.tsx
│   │   ├── problem-card.tsx
│   │   └── status-badge.tsx
│   └── ui/
│       ├── button.tsx
│       └── sheet.tsx
│
├── context/
│   └── auth-context.tsx        ← AuthProvider, useAuth, getInitials
│
└── lib/
    ├── supabase/
    │   ├── client.ts           ← Browser Supabase client
    │   └── server.ts           ← Server Supabase client (RSC / Route Handlers)
    └── api/
        ├── client.ts           ← Base fetch wrapper (ApiError, credentials)
        ├── types.ts            ← All TypeScript types (mirrors backend Zod schemas)
        ├── hackathons.ts       ← hackathonsApi
        ├── problems.ts         ← problemsApi
        ├── teams.ts            ← teamsApi, invitationsApi
        ├── projects.ts         ← projectsApi, evaluationsApi, judgesApi, impactApi
        ├── notifications.ts    ← notificationsApi
        ├── profile.ts          ← profileApi
        ├── admin.ts            ← adminApi
        └── index.ts            ← Barrel re-export
```

---

## API Client Usage

Import from `@/lib/api`:

```ts
import { hackathonsApi, problemsApi, ApiError } from '@/lib/api'

// Fetch all open hackathons
const hackathons = await hackathonsApi.list('OPEN')

// Fetch a specific problem
const problem = await problemsApi.get('some-uuid')

// Handle errors
try {
  await teamsApi.create({ name: 'My Team', hackathon_id: 'uuid' })
} catch (err) {
  if (err instanceof ApiError) {
    console.error(err.status, err.message)  // e.g. 403 "Forbidden"
  }
}
```

### Available API modules

| Module | Methods |
|---|---|
| `hackathonsApi` | `list`, `get`, `create`, `update`, `delete`, `register`, `unregister`, `listParticipants`, `listProblems`, `addProblem`, `removeProblem`, `assignJudge`, `unassignJudge`, `leaderboard`, `impact` |
| `problemsApi` | `list`, `get`, `create`, `update`, `delete`, `listComments`, `addComment`, `vote`, `unvote` |
| `teamsApi` | `list`, `get`, `create`, `update`, `delete`, `invite`, `listMembers`, `removeMember` |
| `invitationsApi` | `accept`, `reject` |
| `projectsApi` | `list`, `get`, `create`, `update`, `delete`, `submit`, `listEvaluations`, `createEvaluation`, `listImpact`, `addImpact` |
| `evaluationsApi` | `update` |
| `judgesApi` | `myProjects` |
| `impactApi` | `update` |
| `notificationsApi` | `list`, `markRead`, `markAllRead`, `delete` |
| `profileApi` | `me`, `update` |
| `adminApi` | `dashboard`, `listUsers`, `updateUser`, `deleteUser`, `listHackathons`, `listProblems`, `listTeams`, `listProjects`, `listEvaluations` |

---

## useAuth Hook

```ts
import { useAuth, getInitials } from '@/context/auth-context'

function MyComponent() {
  const {
    user,       // Supabase User | null
    session,    // Supabase Session | null
    profile,    // Profile | null  (from /api/profiles/me)
    loading,    // boolean — true until first session check completes
    signIn,     // (email, password) => Promise<{ error: string | null }>
    signUp,     // (email, password, name) => Promise<{ error: string | null }>
    signOut,    // () => Promise<void>
    refreshProfile,  // () => Promise<void> — re-fetches /api/profiles/me
  } = useAuth()
}
```

`getInitials(name)` converts `"Alex Johnson"` → `"AJ"`.

---

## Backend API Summary

All routes live at `http://localhost:3000/api/`. Full details in `README.md`.

| Domain | Routes |
|---|---|
| Profiles | `GET/PATCH /api/profiles/me` |
| Problems | CRUD + comments + votes |
| Hackathons | CRUD + register + participants + problems + judges + leaderboard + impact |
| Teams | CRUD + invite + members |
| Invitations | accept / reject |
| Projects | CRUD + submit + evaluations + impact |
| Evaluations | update + judge view |
| Notifications | list + mark read + delete |
| Admin | dashboard + full CRUD on all entities |

Authentication: Supabase Auth cookie — set by the browser after sign-in, read by the backend on every protected request.

---

## Production Deployment

1. Deploy the **backend** (`backend/`) as a Next.js app (Vercel, Railway, etc.)
2. Set backend env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
3. Run `npx supabase db push` against your production Supabase project
4. Deploy the **frontend** (`frontend/`) as a separate Next.js app
5. Set frontend env vars — set `NEXT_PUBLIC_API_URL` to the backend's production URL
6. In your Supabase project → **Authentication → URL Configuration**, add the frontend URL to **Allowed Redirect URLs**

---

## Route Protection

### Server-side (middleware)
`frontend/middleware.ts` runs on every request via the Next.js Edge runtime. It uses `@supabase/ssr` to read the session cookie and:
- Redirects unauthenticated visitors away from protected routes to `/login?next=<path>`
- Redirects authenticated users away from `/login` and `/register` to `/dashboard`

Protected routes: `/dashboard`, `/hackathons`, `/problems`, `/teams`, `/projects`, `/leaderboard`, `/notifications`, `/profile`, `/settings`, `/admin`, `/judge`, `/organizer`, `/impact`

### Client-side (ProtectedRoute)
`components/auth/protected-route.tsx` provides a second layer for role-based access:
- Shows a spinner while `loading` is true
- Redirects to `/login` if `user` is null (handles edge cases)
- Shows a **403 screen** if the user's role is not in the `roles` prop

```tsx
// Require any authenticated user
<ProtectedRoute>…</ProtectedRoute>

// Require a specific role
<ProtectedRoute roles={['ADMIN']}>…</ProtectedRoute>
<ProtectedRoute roles={['JUDGE', 'ADMIN']}>…</ProtectedRoute>
```

---

## CORS Note (Cross-Origin Development)

In development, the frontend (`:3001`) calls the backend (`:3000`) cross-origin. Cookies cannot be forwarded cross-origin reliably, so the frontend API client (`lib/api/client.ts`) reads the Supabase `access_token` from the active session and attaches it as an `Authorization: Bearer <token>` header on every request.

The backend `session.ts` checks this header first, then falls back to the session cookie for same-origin requests.

If you see CORS errors, add this to `backend/next.config.ts` (or `.mjs`):

```js
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'http://localhost:3001' },
        { key: 'Access-Control-Allow-Credentials', value: 'true' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,DELETE,OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
      ],
    },
  ]
},
```

In production on the same domain (both apps behind a reverse proxy), CORS is not needed.

---

## What's Still Outstanding

| Item | Notes |
|---|---|
| Seed data | See `docs/18_SEED_DATA.md` — dev-only idempotent script |
| Playwright E2E tests | sign-up → hackathon → team → submit → evaluate flow |
| File uploads | Supabase Storage for `project_submissions.document_url` and `problems.image_url` |
| Individual detail pages | `/hackathons/[id]`, `/problems/[id]`, `/teams/[id]`, `/projects/[id]` |
| Admin panel UI | `/admin/*` pages consuming `adminApi` |
| Judge dashboard UI | `/judge/*` pages consuming `judgesApi` |
| CORS header config | Only needed if backend and frontend are on separate origins in production |

# Hack4Good — Integration Guide

Single source of truth for running the full Hack4Good stack locally and in production.

---

## Repository Layout

```
docs/
├── backend/          ← Next.js 16 API server  (port 3000)
├── frontend/         ← Next.js 16 UI app       (port 3001)
├── docs/             ← Requirements, specs, design documents
├── INTEGRATION.md    ← This file
└── README.md         ← Full-stack README
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | v20+ |
| npm | v10+ |
| Supabase project | any (free tier works) |
| Supabase CLI | latest — [install guide](https://supabase.com/docs/guides/cli/getting-started) |

---

## Environment Variables

### Backend — `backend/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-secret>
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

| Variable | Where to find it | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Dashboard → Project Settings → API | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Dashboard → Project Settings → API | Anon key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → Project Settings → API → service_role | Admin API — invite-by-email, notification inserts, bootstrap script |
| `NEXT_PUBLIC_SITE_URL` | Set manually | Frontend URL for email redirect links |

> `SUPABASE_SERVICE_ROLE_KEY` is server-side only — never exposed to the browser.

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon-key>
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## First-Time Database Setup

```bash
cd backend

# 1. Authenticate and link (first time only)
npx supabase login
npx supabase link --project-ref <your-project-ref>

# 2. Push all migrations
npx supabase db push
```

### Migrations applied (in order)

| File | What it does |
|---|---|
| `000000_initial_schema.sql` | All tables, constraints, indexes, RLS policies, DB functions, triggers |
| `000001_auth_profile_provisioning.sql` | Auto-creates `profiles` row on Auth sign-up |
| `000002_problem_votes.sql` | `problem_votes` table (one vote per user per problem) |
| `000003_bootstrap_first_admin.sql` | `bootstrap_first_admin(uuid)` RPC for first-admin setup |
| `000004_teams_visibility.sql` | Restricts teams SELECT to members/leaders/managers/admins |
| `000005_notifications_insert_policy.sql` | Allows server-side notification inserts |

---

## Running Locally

Open **two terminals**.

### Terminal 1 — Backend

```bash
cd backend
npm install
npm run dev        # → http://localhost:3000
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev -- -p 3001   # → http://localhost:3001
```

---

## Bootstrap First Admin

After first deploy, all users have role `PARTICIPANT`. Promote the first admin:

```bash
cd backend
npm run bootstrap:admin -- --confirm
```

Requires `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env.local`.
This promotes `admin@hack4good.dev` to `ADMIN` using a SECURITY DEFINER DB function.
The function enforces: target must exist, zero ADMINs currently exist, verifies result.

After success: use `/admin` in the app to promote other users (ORGANIZER, JUDGE).

---

## Authentication Flow

```
User fills in login/register form
        │
        ▼
Supabase Auth — sets sb-* session cookies in browser
        │
        ▼
frontend API client attaches Authorization: Bearer <access_token>
        │   (required for cross-origin: frontend :3001 → backend :3000)
        ▼
backend session.ts — reads Bearer header first, falls back to cookie
        │
        ▼
getAuthenticatedActor() — looks up profiles.role for the user
        │
        ▼
AuthProvider loads profile via GET /api/profiles/me
        │
        ▼
All pages re-render with real user + profile data
```

### Password reset flow

1. `/forgot-password` → calls `supabase.auth.resetPasswordForEmail()` → email sent
2. User clicks link → lands on `/reset-password#access_token=...&type=recovery`
3. Page detects `PASSWORD_RECOVERY` event → `supabase.auth.updateUser({ password })`
4. Redirect to `/dashboard`

---

## Route Protection

### Server-side (`frontend/proxy.ts`)
Next.js 16 proxy runs on every request:
- Unauthenticated → protected routes redirect to `/login?next=<path>`
- Authenticated → `/login`, `/register` redirect to `/dashboard`

Protected routes: `/dashboard`, `/hackathons`, `/problems`, `/teams`, `/projects`, `/leaderboard`, `/notifications`, `/profile`, `/settings`, `/admin`, `/judge`, `/organizer`, `/impact`

### Client-side (`components/auth/protected-route.tsx`)
Second layer for role-based access:

```tsx
<ProtectedRoute>…</ProtectedRoute>                        // any authenticated user
<ProtectedRoute roles={['ADMIN']}>…</ProtectedRoute>      // admin only
<ProtectedRoute roles={['JUDGE','ADMIN']}>…</ProtectedRoute>
```

Shows a 403 screen with role name if access is denied.

---

## Frontend Page Map

| Page | Route | Who can see | API calls |
|---|---|---|---|
| Landing | `/` | Public | None |
| Sign in | `/login` | Guest | Supabase Auth |
| Sign up | `/register` | Guest | Supabase Auth |
| Forgot password | `/forgot-password` | Guest | Supabase Auth |
| Reset password | `/reset-password` | Guest | Supabase Auth |
| Dashboard | `/dashboard` | All roles | hackathons, problems, notifications, teams, projects |
| Hackathons list | `/hackathons` | All roles | `GET /api/hackathons` |
| Hackathon detail | `/hackathons/[id]` | All roles | hackathon + problems + teams; ORGANIZER/ADMIN see manage panel |
| Problems list | `/problems` | All roles | `GET /api/problems` |
| Problem detail | `/problems/[id]` | All roles | problem + comments + vote |
| Teams list | `/teams` | All roles | `GET /api/teams` (RLS: own teams only) |
| Team detail | `/teams/[id]` | Members only | team + members + projects; leader sees invite form |
| Projects list | `/projects` | All roles | `GET /api/projects` |
| Project detail | `/projects/[id]` | Members/judges | project + evaluations + impact |
| New project | `/projects/new` | PARTICIPANT, ADMIN | `POST /api/projects` |
| Notifications | `/notifications` | All roles | notifications + pending invitations (Accept/Decline) |
| Leaderboard | `/leaderboard` | All roles | `GET /api/hackathons/:id/leaderboard` |
| Profile | `/profile` | All roles | `GET/PATCH /api/profiles/me` |
| Settings | `/settings` | All roles | (UI only, no API yet) |
| Admin | `/admin` | ADMIN only | `adminApi.*` |
| Judge | `/judge` | JUDGE, ADMIN | `judgesApi.myProjects()` + evaluations |
| Organizer | `/organizer` | ORGANIZER, ADMIN | hackathons + teams + projects |
| Impact | `/impact` | All roles | `projectsApi.listImpact()` + `addImpact()` |

---

## Team Invitation Flow

1. Team leader goes to `/teams/[id]`
2. Enters invitee's **email address** in the invite form
3. Backend: looks up user UUID by email (service-role), creates `team_invitations` row, inserts in-app notification (service-role), sends magic-link email via Supabase Auth
4. Invitee opens `/notifications` — sees "Team invitations" section with **Accept** / **Decline** buttons
5. Accept → `POST /api/invitations/:id/accept` → added to `team_members`
6. Decline → `POST /api/invitations/:id/reject` → invitation marked REJECTED

> Requires `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env.local`.

---

## API Client Usage

```ts
import { hackathonsApi, teamsApi, invitationsApi, ApiError } from '@/lib/api'

// List open hackathons
const hackathons = await hackathonsApi.list()

// Invite by email
await teamsApi.invite(teamId, 'user@example.com')

// List + respond to pending invitations
const pending = await invitationsApi.listMine()
await invitationsApi.accept(pending[0].id)

// Error handling
try {
  await projectsApi.create(input)
} catch (err) {
  if (err instanceof ApiError) {
    console.error(err.status, err.message)
  }
}
```

### API modules

| Module | Key methods |
|---|---|
| `hackathonsApi` | `list`, `get`, `create`, `update`, `delete`, `register`, `unregister`, `listParticipants`, `listProblems`, `addProblem`, `removeProblem`, `assignJudge`, `unassignJudge`, `leaderboard`, `impact` |
| `problemsApi` | `list`, `get`, `create`, `update`, `delete`, `listComments`, `addComment`, `vote`, `unvote` |
| `teamsApi` | `list`, `get`, `create`, `update`, `delete`, `invite(id, email)`, `listMembers`, `removeMember` |
| `invitationsApi` | `listMine`, `accept`, `reject` |
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

const {
  user,            // Supabase User | null
  session,         // Supabase Session | null
  profile,         // Profile | null  — full_name, role, bio, skills, location
  loading,         // true until first session check completes
  signIn,          // (email, password) => Promise<{ error: string | null }>
  signUp,          // (email, password, name) => Promise<{ error: string | null }>
  signOut,         // () => Promise<void>
  refreshProfile,  // () => Promise<void>
} = useAuth()

getInitials('Alex Johnson')  // → 'AJ'
```

> `profile.full_name` — backend column name (not `name`).
> `profile.email` does not exist — read `user.email` instead.

---

## Backend API Reference

All routes at `http://localhost:3000/api/`. Protected routes require `Authorization: Bearer <token>`.

### Roles

| Role | Capabilities |
|---|---|
| `PARTICIPANT` | Submit problems, register for hackathons, create/join teams, submit projects |
| `ORGANIZER` | Create and manage hackathons, assign judges |
| `JUDGE` | View assigned submissions, score and provide feedback |
| `ADMIN` | Everything |

### Route summary

```
GET/PATCH   /api/profiles/me

GET/POST    /api/problems
GET/PATCH/DELETE /api/problems/:id
GET/POST    /api/problems/:id/comments
POST/DELETE /api/problems/:id/vote

GET/POST    /api/hackathons
GET/PATCH/DELETE /api/hackathons/:id
POST/DELETE /api/hackathons/:id/register
GET         /api/hackathons/:id/participants
GET/POST    /api/hackathons/:id/problems
DELETE      /api/hackathons/:id/problems/:problemId
POST/DELETE /api/hackathons/:id/judges/:judgeId
GET         /api/hackathons/:id/leaderboard
GET         /api/hackathons/:id/impact

GET/POST    /api/teams
GET/PATCH/DELETE /api/teams/:id
POST        /api/teams/:id/invite          ← body: { email }
GET         /api/teams/:id/members
DELETE      /api/teams/:id/members/:userId

GET         /api/invitations/me            ← pending invitations for current user
POST        /api/invitations/:id/accept
POST        /api/invitations/:id/reject

GET/POST    /api/projects
GET/PATCH/DELETE /api/projects/:id
POST        /api/projects/:id/submit
GET/POST    /api/projects/:id/evaluation
GET/POST    /api/projects/:id/impact

PATCH       /api/evaluations/:id
GET         /api/judges/me/projects

PATCH       /api/impact/:id

GET         /api/notifications
PATCH       /api/notifications/:id/read
PATCH       /api/notifications/read-all
DELETE      /api/notifications/:id

GET         /api/admin/dashboard
GET/PATCH/DELETE /api/admin/users/:id
GET         /api/admin/users
GET         /api/admin/hackathons
GET         /api/admin/problems
GET         /api/admin/teams
GET         /api/admin/projects
GET         /api/admin/evaluations
```

---

## CORS (Cross-Origin Development)

Frontend (`:3001`) → backend (`:3000`) is cross-origin. The API client attaches `Authorization: Bearer <token>` on every request. The backend `proxy.ts` adds CORS headers to `/api/*` responses and handles `OPTIONS` preflight.

Allowed origins configured in `backend/proxy.ts`:
```ts
const ALLOWED_ORIGINS = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
]
```

Add your production frontend URL to this list before deploying.

---

## Production Deployment

1. Deploy `backend/` as a Next.js app (Vercel, Railway, Render, etc.)
2. Set all backend env vars including `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SITE_URL`
3. `npx supabase db push` on the production Supabase project
4. Deploy `frontend/` as a separate Next.js app
5. Set `NEXT_PUBLIC_API_URL` to the backend production URL
6. Supabase Dashboard → Authentication → URL Configuration → add frontend URL to **Allowed Redirect URLs**
7. Add production frontend URL to `ALLOWED_ORIGINS` in `backend/proxy.ts`

---

## Current Status

| Area | Status |
|---|---|
| Database schema + RLS + triggers | ✅ Complete |
| All migrations (000000–000005) | ✅ Written — run `npx supabase db push` |
| Auth (sign-up, sign-in, sign-out, reset password) | ✅ Complete |
| Bearer token cross-origin auth | ✅ Complete |
| Role authorization | ✅ Complete |
| All API routes (43 routes) | ✅ Complete |
| Unit tests (68 tests) | ✅ Complete |
| First-admin bootstrap script | ✅ Complete |
| Frontend — all 23 pages connected to real API | ✅ Complete |
| Frontend TypeScript | ✅ 0 errors |
| CORS proxy | ✅ Complete |
| Create hackathon modal (ORGANIZER/ADMIN) | ✅ Complete |
| Hackathon status transitions (ORGANIZER/ADMIN) | ✅ Complete |
| Submit problem modal (PARTICIPANT/ADMIN) | ✅ Complete |
| Create team modal | ✅ Complete |
| Team invite by email + notification + email | ✅ Complete |
| Invitation Accept/Decline on notifications page | ✅ Complete |
| Teams visibility restricted by RLS | ✅ Migration written — apply with db push |
| Seed data | 🔲 Pending |
| Playwright E2E tests | 🔲 Pending |
| File uploads (Supabase Storage) | 🔲 Pending |

---

## What's Still Outstanding

| Item | Notes |
|---|---|
| Apply pending migrations | Run `npx supabase db push` — migrations 000003–000005 must be pushed |
| Seed data | Dev-only idempotent script for demo data |
| Playwright E2E tests | Full user journey: register → hackathon → team → invite → submit → evaluate |
| File uploads | Supabase Storage for `project_submissions.document_url` and `problems.image_url` |
| Hackathon detail — link problems | UI for organizers to link existing problems to a hackathon |
| Project evaluation UI | Form for judges to score a project with individual criteria |
| Settings page persistence | Currently UI-only; wire to profile/notification preferences API |

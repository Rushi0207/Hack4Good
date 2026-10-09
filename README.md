# Hack4Good

**Hack4Good** is a community-powered hackathon platform that connects communities with innovators to identify real-world social problems, organize hackathons, form teams, build solutions, evaluate projects, and track social impact.

---

## Quick Start

> Full instructions including database setup, env vars, auth flow, CORS config, and deployment are in **[INTEGRATION.md](./INTEGRATION.md)**.

```bash
# Terminal 1 — API server
cd backend && npm install && npm run dev      # → http://localhost:3000

# Terminal 2 — UI
cd frontend && npm install && npm run dev -- -p 3001  # → http://localhost:3001
```

You need:
- Node.js v20+, npm v10+
- A [Supabase](https://supabase.com) project (free tier works)
- Each app needs its own `.env.local` — copy from the `.env.example` in each folder

---

## Repository Layout

```
docs/
├── backend/          ← Next.js 16 API server  (port 3000)
├── frontend/         ← Next.js 16 UI app       (port 3001)
├── docs/             ← Requirements, specs, design documents
├── INTEGRATION.md    ← Full-stack setup guide  ← start here
└── README.md         ← This file
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework (both apps) | Next.js 16 App Router, TypeScript |
| Database | Supabase — PostgreSQL + Auth + Row-Level Security |
| Auth | Supabase Auth (cookie-based, no custom password storage) |
| API validation | Zod v4 |
| Frontend styling | Tailwind CSS v4, Base UI, shadcn/ui |
| Unit tests | Vitest (68 tests) |
| E2E tests | Playwright |
| Linting | ESLint (eslint-config-next) |

---

## How it Works

```
Browser (frontend :3001)
    │  Supabase Auth cookies
    ▼
API server (backend :3000)
    │  Authenticated user context via cookie
    ▼
Supabase (PostgreSQL + RLS)
```

- The **frontend** handles all UI: public landing, auth pages, and the authenticated app shell.
- The **backend** exposes 42 REST API routes under `/api/`. Every protected route validates the session cookie and checks role-based permissions server-side.
- **RLS policies** on every table enforce the same authorization rules at the database level — double protection.
- The frontend API client (`frontend/lib/api/`) is fully typed and maps 1-to-1 to the backend routes.

---

## Project Status

| Area | Status |
|---|---|
| Database schema + RLS + triggers | ✅ Complete |
| All migrations (000000–000005) | ✅ Written — apply with `npx supabase db push` |
| Auth (sign-up, sign-in, sign-out, reset password) | ✅ Complete |
| Bearer token cross-origin auth | ✅ Complete |
| Role authorization | ✅ Complete |
| All API routes (43 routes) | ✅ Complete |
| Unit tests (68 tests) | ✅ Complete |
| First-admin bootstrap script | ✅ Complete |
| Frontend — all 23 pages connected to real API | ✅ Complete |
| Frontend TypeScript | ✅ 0 errors |
| CORS proxy (Next.js 16 `proxy.ts`) | ✅ Complete |
| Create hackathon modal + status transitions | ✅ Complete |
| Submit problem modal | ✅ Complete |
| Create team modal | ✅ Complete |
| Team invite by email + in-app + email notification | ✅ Complete |
| Invitation Accept/Decline UI | ✅ Complete |
| Teams visibility restricted by RLS | ✅ Migration written — apply with db push |
| Seed data script | 🔲 Pending |
| Playwright E2E tests | 🔲 Pending |
| File upload (Supabase Storage) | 🔲 Pending |

---

## Backend — API Reference

All routes live under `http://localhost:3000/api/`. Protected routes require a valid Supabase Auth session cookie.

### Roles

| Role | Capabilities |
|---|---|
| `PARTICIPANT` | Submit problems, register for hackathons, create/join teams, submit projects |
| `ORGANIZER` | Create and manage hackathons, assign judges |
| `JUDGE` | View assigned submissions, score and provide feedback |
| `ADMIN` | Everything — full platform management |

### Routes

#### Profiles
```
GET    /api/profiles/me          Get own profile
PATCH  /api/profiles/me          Update profile (name, bio, skills, location, image_url)
```

#### Problems
```
GET    /api/problems                   List (?status= ?category= ?location=)
POST   /api/problems                   Create (PARTICIPANT, ADMIN)
GET    /api/problems/:id               Get
PATCH  /api/problems/:id               Update (owner or ADMIN)
DELETE /api/problems/:id               Delete (owner or ADMIN)
GET    /api/problems/:id/comments      List comments
POST   /api/problems/:id/comments      Add comment (authenticated)
POST   /api/problems/:id/vote          Upvote (authenticated)
DELETE /api/problems/:id/vote          Remove upvote
```

#### Hackathons
```
GET    /api/hackathons                              List (?status=)
POST   /api/hackathons                              Create (ORGANIZER, ADMIN)
GET    /api/hackathons/:id                          Get
PATCH  /api/hackathons/:id                          Update (manager or ADMIN)
DELETE /api/hackathons/:id                          Delete (manager or ADMIN)
POST   /api/hackathons/:id/register                 Register (PARTICIPANT, ADMIN)
DELETE /api/hackathons/:id/register                 Unregister
GET    /api/hackathons/:id/participants              List registrants (manager or ADMIN)
GET    /api/hackathons/:id/problems                 List linked problems (public)
POST   /api/hackathons/:id/problems                 Link a problem (manager or ADMIN)
DELETE /api/hackathons/:id/problems/:problemId      Unlink (manager or ADMIN)
POST   /api/hackathons/:id/judges                   Assign judge (manager or ADMIN)
DELETE /api/hackathons/:id/judges/:judgeId          Unassign judge (manager or ADMIN)
GET    /api/hackathons/:id/leaderboard              Leaderboard (public)
GET    /api/hackathons/:id/impact                   Aggregate impact (public)
```

#### Teams
```
GET    /api/teams                       List (?hackathon_id=)
POST   /api/teams                       Create (PARTICIPANT, ADMIN)
GET    /api/teams/:id                   Get
PATCH  /api/teams/:id                   Update (leader or ADMIN)
DELETE /api/teams/:id                   Delete (leader or ADMIN)
POST   /api/teams/:id/invite            Invite user (leader or ADMIN)
GET    /api/teams/:id/members           List members (public)
DELETE /api/teams/:id/members/:userId   Remove member (leader, self, or ADMIN)
```

#### Invitations
```
POST /api/invitations/:id/accept   Accept (invitee)
POST /api/invitations/:id/reject   Reject (invitee)
```

#### Projects
```
GET    /api/projects                    List (?team_id= ?hackathon_id=)
POST   /api/projects                    Create (team member)
GET    /api/projects/:id                Get
PATCH  /api/projects/:id                Update — DRAFT only (team member or ADMIN)
DELETE /api/projects/:id                Delete — DRAFT only (team member or ADMIN)
POST   /api/projects/:id/submit         Submit (team member or ADMIN)
GET    /api/projects/:id/evaluation     List evaluations (judge/team/manager/ADMIN)
POST   /api/projects/:id/evaluation     Create evaluation (JUDGE, ADMIN)
GET    /api/projects/:id/impact         List impact records (public)
POST   /api/projects/:id/impact         Add impact record (team member or ADMIN)
```

#### Evaluation
```
PATCH /api/evaluations/:id         Update (owning judge or ADMIN)
GET   /api/judges/me/projects      Projects assigned to current judge
```

#### Impact
```
PATCH /api/impact/:id   Update record (team member or ADMIN)
```

#### Notifications
```
GET    /api/notifications             List own notifications
PATCH  /api/notifications/:id/read   Mark as read
PATCH  /api/notifications/read-all   Mark all as read
DELETE /api/notifications/:id        Delete
```

#### Admin
```
GET    /api/admin/dashboard         Platform stats
GET    /api/admin/users             List users
PATCH  /api/admin/users/:id         Update role / name
DELETE /api/admin/users/:id         Delete user
GET    /api/admin/hackathons        List all hackathons
GET    /api/admin/problems          List all problems
GET    /api/admin/teams             List all teams
GET    /api/admin/projects          List all projects
GET    /api/admin/evaluations       List all evaluations
```

---

## Backend — Available Scripts

```bash
cd backend

npm run dev          # Development server with hot reload
npm run build        # Production build
npm start            # Start production server
npm test             # Run unit tests (Vitest)
npm run test:watch   # Unit tests in watch mode
npm run test:e2e     # Playwright E2E tests
npm run lint         # ESLint
```

---

## Backend — Testing

### Unit tests

```bash
npm test
```

68 tests covering:
- Full role permission matrix
- All critical business rules (team size, date ordering, score limits)
- Zod schema validation (empty strings, URL validation, enum rejection, injection blocking)

### E2E tests

Start the dev server first, then:

```bash
npm run test:e2e
```

Tests live in `tests/e2e/`. Base URL defaults to `http://127.0.0.1:3000` — override with `PLAYWRIGHT_BASE_URL`.

---

## Frontend — Page Map

| Page | Route | API calls |
|---|---|---|
| Landing | `/` | None (public) |
| Sign in | `/login` | Supabase Auth |
| Sign up | `/register` | Supabase Auth |
| Dashboard | `/dashboard` | hackathons, problems, notifications, teams, projects |
| Hackathons | `/hackathons` | `GET /api/hackathons` |
| Problems | `/problems` | `GET /api/problems` |
| Teams | `/teams` | `GET /api/teams` |
| Projects | `/projects` | `GET /api/projects` |
| Leaderboard | `/leaderboard` | `GET /api/hackathons/:id/leaderboard` |
| Notifications | `/notifications` | `GET/PATCH/DELETE /api/notifications` |
| Profile | `/profile` | `GET/PATCH /api/profiles/me` |

---

## Frontend — Key Files

```
frontend/
├── context/auth-context.tsx   ← useAuth hook, AuthProvider, getInitials
├── lib/api/                   ← Typed API client for all 42 backend routes
│   ├── client.ts              ← Base fetch wrapper + ApiError
│   ├── types.ts               ← TypeScript types mirroring backend Zod schemas
│   ├── hackathons.ts / problems.ts / teams.ts / projects.ts
│   ├── notifications.ts / profile.ts / admin.ts
│   └── index.ts               ← Barrel export
└── lib/supabase/
    ├── client.ts              ← Browser Supabase client
    └── server.ts              ← Server Supabase client (RSC / Route Handlers)
```

---

## Key Design Decisions

- **Supabase Auth owns identity.** No custom password storage.
- **Double authorization.** Session + role checked server-side on every protected route, and RLS enforces the same rules at the database level.
- **Thin route handlers.** Business logic lives in `backend/services/`, routes only parse input and call services.
- **Zod v4 everywhere.** All external input is validated before it touches the database.
- **Safe error responses.** `errorResponse()` maps known error types to HTTP status codes and never leaks internals.
- **Typed end-to-end.** `frontend/lib/api/types.ts` mirrors the backend Zod schemas so API contracts break at compile time if they drift.

---

## Environment Variables

### Backend (`backend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon key — safe for browser |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Same Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Same Supabase anon key |
| `NEXT_PUBLIC_API_URL` | ✅ | Backend base URL — `http://localhost:3000` locally |

> The service-role key is **never** used anywhere in this project.

---

## Contributing

1. Read `docs/` before making changes — the docs are the source of truth.
2. Never disable RLS.
3. Never store passwords in application tables.
4. All new backend routes must validate input with Zod and authorize server-side.
5. Keep `frontend/lib/api/types.ts` in sync with backend Zod schemas when changing the API.
6. Add unit tests for any new business rules.
7. Run `npx supabase db push` after adding a migration.

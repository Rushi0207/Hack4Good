# Hack4Good — Backend

**Hack4Good** is a community-based hackathon platform that connects communities with innovators to identify real-world social problems, organize hackathons, form teams, develop solutions, evaluate projects, and track social impact.

---

## Project Structure

```
docs/
├── backend/          ← Next.js API backend (this project)
├── frontend/         ← Frontend implementation
└── docs/             ← Requirements, specs, and design documents
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router (TypeScript) |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Validation | Zod v4 |
| Unit tests | Vitest |
| E2E tests | Playwright |
| Linting | ESLint (eslint-config-next) |

---

## Prerequisites

- **Node.js** v20 or later
- **npm** v10 or later
- A **Supabase** project ([supabase.com](https://supabase.com)) — free tier works
- **Supabase CLI** (for applying migrations) — [install guide](https://supabase.com/docs/guides/cli/getting-started)

---

## Local Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

Copy the example and fill in your Supabase project credentials:

```bash
copy .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-publishable-key>
```

Find these values in your Supabase dashboard → **Project Settings → API**.

> ⚠️ Never commit `.env.local`. It is already in `.gitignore`.

### 3. Apply database migrations

Link to your Supabase project (first time only):

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

Push all migrations:

```bash
npx supabase db push
```

This applies three migrations in order:
- `20260906000000_initial_schema.sql` — all tables, constraints, indexes, triggers, RLS policies
- `20260906000001_auth_profile_provisioning.sql` — auto-creates a profile on user sign-up
- `20260906000002_problem_votes.sql` — problem upvoting table

### 4. Start the development server

```bash
npm run dev
```

The API is available at **http://localhost:3000**.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (hot reload) |
| `npm run build` | Production build |
| `npm start` | Start production server (after build) |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint` | ESLint check |

---

## API Overview

All routes are under `/api/`. Protected routes require a valid Supabase Auth session cookie (set automatically by the browser after sign-in via the frontend).

### Authentication
Authentication is handled entirely by **Supabase Auth** — sign-up, sign-in, sign-out, and password reset. There is no custom auth endpoint.

### Roles
| Role | Can do |
|---|---|
| `PARTICIPANT` | Submit problems, register for hackathons, create/join teams, submit projects |
| `ORGANIZER` | Create and manage hackathons, assign judges |
| `JUDGE` | View assigned submissions, score and provide feedback |
| `ADMIN` | Everything — full platform management |

### Route Reference

#### Profiles
```
GET    /api/profiles/me          Get own profile
PATCH  /api/profiles/me          Update own profile (name, bio, skills, location, image_url)
```

#### Problems
```
GET    /api/problems              List problems (filter: ?status= ?category= ?location=)
POST   /api/problems              Create problem (PARTICIPANT, ADMIN)
GET    /api/problems/:id          Get problem
PATCH  /api/problems/:id          Update problem (owner or ADMIN)
DELETE /api/problems/:id          Delete problem (owner or ADMIN)
GET    /api/problems/:id/comments List comments
POST   /api/problems/:id/comments Add comment (authenticated)
POST   /api/problems/:id/vote     Upvote problem (authenticated)
DELETE /api/problems/:id/vote     Remove upvote
```

#### Hackathons
```
GET    /api/hackathons                             List hackathons (?status=)
POST   /api/hackathons                             Create hackathon (ORGANIZER, ADMIN)
GET    /api/hackathons/:id                         Get hackathon
PATCH  /api/hackathons/:id                         Update hackathon (manager or ADMIN)
DELETE /api/hackathons/:id                         Delete hackathon (manager or ADMIN)
POST   /api/hackathons/:id/register                Register for hackathon (PARTICIPANT, ADMIN)
DELETE /api/hackathons/:id/register                Unregister
GET    /api/hackathons/:id/participants             List registrants (manager or ADMIN)
GET    /api/hackathons/:id/problems                List linked problems (public)
POST   /api/hackathons/:id/problems                Link a problem (manager or ADMIN)
DELETE /api/hackathons/:id/problems/:problemId     Unlink a problem (manager or ADMIN)
POST   /api/hackathons/:id/judges                  Assign a judge (manager or ADMIN)
DELETE /api/hackathons/:id/judges/:judgeId         Unassign a judge (manager or ADMIN)
GET    /api/hackathons/:id/leaderboard             Leaderboard (public)
GET    /api/hackathons/:id/impact                  Aggregate impact records (public)
```

#### Teams
```
GET    /api/teams                      List teams (?hackathon_id=)
POST   /api/teams                      Create team (PARTICIPANT, ADMIN)
GET    /api/teams/:id                  Get team
PATCH  /api/teams/:id                  Update team (leader or ADMIN)
DELETE /api/teams/:id                  Delete team (leader or ADMIN)
POST   /api/teams/:id/invite           Invite a user (leader or ADMIN)
GET    /api/teams/:id/members          List members (public)
DELETE /api/teams/:id/members/:userId  Remove member (leader, self, or ADMIN)
```

#### Invitations
```
POST /api/invitations/:id/accept   Accept invitation (invitee)
POST /api/invitations/:id/reject   Reject invitation (invitee)
```

#### Projects
```
GET    /api/projects              List projects (?team_id= ?hackathon_id=)
POST   /api/projects              Create project (team member)
GET    /api/projects/:id          Get project
PATCH  /api/projects/:id          Update project — DRAFT only (team member or ADMIN)
DELETE /api/projects/:id          Delete project — DRAFT only (team member or ADMIN)
POST   /api/projects/:id/submit   Submit project (team member or ADMIN)
GET    /api/projects/:id/evaluation  List evaluations (judge/team/manager/ADMIN)
POST   /api/projects/:id/evaluation  Create evaluation (JUDGE, ADMIN)
GET    /api/projects/:id/impact   List impact records (public)
POST   /api/projects/:id/impact   Add impact record (team member or ADMIN)
```

#### Evaluation
```
PATCH /api/evaluations/:id          Update evaluation (owning judge or ADMIN)
GET   /api/judges/me/projects       Projects assigned to the current judge
```

#### Impact
```
PATCH /api/impact/:id   Update impact record (team member or ADMIN)
```

#### Notifications
```
GET    /api/notifications           List own notifications
PATCH  /api/notifications/:id/read  Mark as read
PATCH  /api/notifications/read-all  Mark all as read
DELETE /api/notifications/:id       Delete notification
```

#### Admin
```
GET    /api/admin/dashboard         Platform stats (ADMIN)
GET    /api/admin/users             List users (ADMIN)
PATCH  /api/admin/users/:id         Update user role / name (ADMIN)
DELETE /api/admin/users/:id         Delete user (ADMIN)
GET    /api/admin/hackathons        List all hackathons (ADMIN)
GET    /api/admin/problems          List all problems (ADMIN)
GET    /api/admin/teams             List all teams (ADMIN)
GET    /api/admin/projects          List all projects (ADMIN)
GET    /api/admin/evaluations       List all evaluations (ADMIN)
```

---

## Testing

### Unit Tests

```bash
npm test
```

68 tests covering:
- Full role permission matrix
- All critical business rules (team size, date ordering, score limits, etc.)
- Zod schema validation (empty strings, URL validation, enum rejection, field injection blocking)

### E2E Tests (Playwright)

Start the dev server first, then:

```bash
npm run test:e2e
```

E2E tests live in `tests/e2e/`. The base URL defaults to `http://127.0.0.1:3000` — override with `PLAYWRIGHT_BASE_URL` env var.

---

## Project Status

| Area | Status |
|---|---|
| Database schema + RLS + triggers | ✅ Complete |
| Auth provisioning | ✅ Complete |
| Session handling | ✅ Complete |
| Role authorization | ✅ Complete |
| All API routes (42 routes) | ✅ Complete |
| Unit tests (68 tests) | ✅ Complete |
| Production build | ✅ Clean |
| Seed data script | 🔲 Not yet |
| Playwright E2E tests | 🔲 Not yet |
| File upload (Supabase Storage) | 🔲 Not yet |
| Frontend | 🔲 Separate project |

---

## Key Design Decisions

- **Supabase Auth owns identity.** No custom password storage — ever.
- **Double authorization.** Every protected route checks session + role server-side, and RLS enforces the same rules at the database level.
- **Thin route handlers.** Business logic lives in `services/`, routes only parse input and call services.
- **Zod v4 everywhere.** All external input is validated before it touches the database.
- **Never expose internals.** `errorResponse()` maps known error types to safe HTTP responses and logs unexpected errors server-side only.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase publishable (anon) key — safe for browser |

> The service-role key is **never** used in this project. All operations run under the authenticated user's RLS context.

---

## Contributing

1. Read `docs/` before making any changes — the docs are the source of truth.
2. Never disable RLS.
3. Never store passwords in application tables.
4. All new routes must validate input with Zod and authorize server-side.
5. Add unit tests for any new business rules.

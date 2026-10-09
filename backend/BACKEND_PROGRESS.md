# Backend Progress

## ✅ Completed

### Phase 1 — Foundation
- Next.js 16 App Router, strict TypeScript, Supabase client helpers (browser/server/proxy), Zod, Vitest, Playwright scaffolding, safe environment templates.
- Verified: install, TypeScript, lint, production build.

### Phase 2 — Database
- `20260906000000_initial_schema.sql` — all tables, FK/unique/check constraints, indexes, `set_updated_at` trigger, RLS on every table, full RLS policy set, DB helper functions (`current_role`, `is_admin`, `is_participant`, `is_hackathon_manager`, `is_team_member`, `is_team_leader`, `is_assigned_judge`), business-rule triggers (`validate_team`, `validate_team_member`, `validate_project_problem`, `validate_submission`, `validate_evaluation`, `validate_score`, `recalculate_evaluation_total`, `protect_profile_role`).
- `20260906000001_auth_profile_provisioning.sql` — auto-provision `profiles` row on Auth sign-up using `raw_user_meta_data ->> 'full_name'`.
- `20260906000002_problem_votes.sql` — `problem_votes` table with RLS (one vote per user per problem).
- `20260906000003_bootstrap_first_admin.sql` — `public.bootstrap_first_admin(uuid)` SECURITY DEFINER function. Uses `SET LOCAL session_replication_role = 'replica'` to bypass `protect_profile_role` trigger for a one-time promotion. Guards: target must exist, zero ADMINs must currently exist, verifies result. EXECUTE granted to `service_role` only.
- `20260906000004_teams_visibility.sql` — drops the open `"teams are readable" using (true)` policy, replaces with `"teams visible to members managers and admins"` — a team is only SELECT-able by its leader, members, the hackathon manager, or an admin.
- `20260906000005_notifications_insert_policy.sql` — adds INSERT policy on notifications so route handlers can create notifications for other users (required for team invitation notifications).
- `20260906000006_teams_invitee_visibility.sql` — pending invitees can SELECT the invited team so invitation list can resolve team names under RLS.

### Phase 3 — Auth / Session / Authorization
- `lib/auth/session.ts` — `getAuthenticatedUserId`: reads `Authorization: Bearer` header first (cross-origin), falls back to session cookie.
- `lib/auth/authorization.ts` — `getAuthenticatedActor`, `requireAuthenticatedActor`, `requireRoleAction`, `canPerformRoleAction`, `UnauthenticatedError`, `ForbiddenError`, full role→actions permission map.
- `lib/supabase/proxy.ts` — session-refresh Supabase helper (used by the root `proxy.ts`).
- `proxy.ts` (root) — Next.js 16 proxy (replaces deprecated `middleware.ts`); handles CORS for cross-origin requests from frontend (:3001) and refreshes Supabase session cookies.
- `types/auth.ts` — `UserRole`, `AuthenticatedActor`, `userRoleSchema`.

### Phase 4 — Shared Infrastructure
- `lib/api/response.ts` — `ok`, `errorResponse`, `notFound`, `conflict`, `badRequest`.

### Phase 5 — Types (Zod schemas + TS types)
All domain types in `types/`:
`auth`, `profile`, `problem`, `hackathon`, `team` (inviteMemberSchema now accepts `email`), `project`, `evaluation`, `impact`, `notification`.

### Phase 6 — Services
| File | Responsibilities |
|---|---|
| `services/profile.service.ts` | `getProfileById`, `updateProfile` |
| `services/problem.service.ts` | `listProblems`, `getProblemById`, `createProblem`, `updateProblem`, `deleteProblem`, `listComments`, `createComment` |
| `services/hackathon.service.ts` | full CRUD + register/unregister + participants + problems + judges |
| `services/team.service.ts` | full CRUD + `inviteMember(teamId, inviterName, email)` (looks up UUID by email via admin API, creates invitation, inserts notification via service-role, sends magic-link email) + `listMyInvitations(userId)` + `respondToInvitation` + `removeMember` |
| `services/project.service.ts` | full CRUD + submit |
| `services/evaluation.service.ts` | criteria + judge assignment + evaluations + leaderboard |
| `services/impact.service.ts` | `listImpactByProject`, `listImpactByHackathon`, `createImpact`, `updateImpact` |
| `services/notification.service.ts` | `listNotifications`, `markAsRead`, `markAllAsRead`, `deleteNotification` |
| `services/admin.service.ts` | `adminDashboard` (returns `total_*` keys), `adminListUsers`, `adminUpdateUser`, `adminDeleteUser`, `adminList` |

### Phase 7 — API Route Handlers (42 routes + 2 new)

All original 42 routes from `docs/10_API_SPECIFICATION.md` — complete.

**Additional routes added during integration:**
- `GET /api/invitations/me` — pending invitations for the authenticated user (team name included via join)

### Phase 8 — Unit Tests
- 68 tests — all passing. TypeScript: clean. ESLint: clean.

### Phase 9 — Bootstrap Script
- `scripts/bootstrap-admin.ts` — promotes `admin@hack4good.dev` to ADMIN via `bootstrap_first_admin` RPC.
- Requires `--confirm` flag, idempotent, verifies Auth user and resulting role.
- Run: `npm run bootstrap:admin -- --confirm`
- Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

---

## Environment Variables (`backend/.env.local`)

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Admin API access — invite-by-email + bootstrap script |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Frontend URL for email redirect links (e.g. `http://localhost:3001`) |

---

## Key Design Decisions

- **Supabase Auth owns identity.** No custom password storage.
- **Double authorization.** Session + role checked server-side; RLS enforces at DB level.
- **Thin route handlers.** Business logic lives in `services/`.
- **Zod v4 everywhere.** All external input validated before touching DB.
- **Safe error responses.** `errorResponse()` never leaks internals.
- **Bearer token for cross-origin.** `session.ts` reads `Authorization: Bearer` header before falling back to cookie — supports frontend on a different port. `createSupabaseServerClient` also forwards that Bearer header so PostgREST RLS resolves `auth.uid()` (required for accept-invitation and other cookie-less cross-origin writes).
- **Service-role scoped.** Admin client used only for: (a) email→UUID lookup in invite flow, (b) notification inserts on behalf of other users, (c) bootstrap script. Never used for general data access.

---

## 🔲 Remaining / Future Work

- **Apply all migrations** — run `npx supabase db push` to apply migrations 000003–000005.
- **Seed data** — dev-only idempotent seed script.
- **Playwright E2E tests** — sign-up → hackathon → team → invite → submit → evaluate flow.
- **File uploads** — Supabase Storage for `project_submissions.document_url` and `problems.image_url`.
- **Deployment** — configure production env vars, run `supabase db push` on prod project, deploy Next.js app.

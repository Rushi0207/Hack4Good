# Backend Progress

## ✅ Completed

### Phase 1 — Foundation
- Next.js 16 App Router, strict TypeScript, Supabase client helpers (browser/server/proxy), Zod, Vitest, Playwright scaffolding, and safe environment templates.
- Verified: install, TypeScript, lint, and production build.

### Phase 2 — Database
- `20260906000000_initial_schema.sql` — all tables, FK/unique/check constraints, indexes, `set_updated_at` trigger, RLS on every table, full RLS policy set, DB helper functions (`current_role`, `is_admin`, `is_participant`, `is_hackathon_manager`, `is_team_member`, `is_team_leader`, `is_assigned_judge`), business-rule triggers (`validate_team`, `validate_team_member`, `validate_project_problem`, `validate_submission`, `validate_evaluation`, `validate_score`, `recalculate_evaluation_total`, `protect_profile_role`).
- `20260906000001_auth_profile_provisioning.sql` — auto-provision `profiles` row on Auth sign-up.
- `20260906000002_problem_votes.sql` — `problem_votes` table with RLS (one vote per user per problem).
- Supabase project linked and migrations applied.

### Phase 3 — Auth / Session / Authorization
- `lib/auth/session.ts` — `getAuthenticatedUserId` via `auth.getClaims()`.
- `lib/auth/authorization.ts` — `getAuthenticatedActor`, `requireAuthenticatedActor`, `requireRoleAction`, `canPerformRoleAction`, `UnauthenticatedError`, `ForbiddenError`, full role→actions permission map.
- `lib/supabase/proxy.ts` — session-refresh middleware proxy.
- `types/auth.ts` — `UserRole`, `AuthenticatedActor`, `userRoleSchema`.

### Phase 4 — Shared Infrastructure
- `lib/api/response.ts` — `ok`, `errorResponse`, `notFound`, `conflict`, `badRequest` (maps typed errors to HTTP status codes; never leaks internals).

### Phase 5 — Types (Zod schemas + TS types for all domains)
| File | Contents |
|---|---|
| `types/auth.ts` | `UserRole`, `AuthenticatedActor` |
| `types/profile.ts` | `profileSchema`, `updateProfileSchema` |
| `types/problem.ts` | `problemSchema`, `createProblemSchema`, `updateProblemSchema`, `createCommentSchema`, `commentSchema`, `problemListQuerySchema` |
| `types/hackathon.ts` | `hackathonSchema`, `createHackathonSchema`, `updateHackathonSchema`, `hackathonListQuerySchema` |
| `types/team.ts` | `teamSchema`, `createTeamSchema`, `updateTeamSchema`, `inviteMemberSchema`, `teamMemberSchema`, `teamInvitationSchema` |
| `types/project.ts` | `projectSchema`, `createProjectSchema`, `updateProjectSchema`, `submitProjectSchema` |
| `types/evaluation.ts` | `evaluationCriterionSchema`, `createCriterionSchema`, `evaluationSchema`, `evaluationScoreSchema`, `scoreInputSchema`, `createEvaluationSchema`, `updateEvaluationSchema`, `assignJudgeSchema`, `leaderboardEntrySchema` |
| `types/impact.ts` | `impactRecordSchema`, `createImpactSchema`, `updateImpactSchema` |
| `types/notification.ts` | `notificationSchema` |

### Phase 6 — Services (thin DB layer, no business logic in routes)
| File | Responsibilities |
|---|---|
| `services/profile.service.ts` | `getProfileById`, `updateProfile` |
| `services/problem.service.ts` | `listProblems`, `getProblemById`, `createProblem`, `updateProblem`, `deleteProblem`, `listComments`, `createComment` |
| `services/hackathon.service.ts` | `listHackathons`, `getHackathonById`, `createHackathon`, `updateHackathon`, `deleteHackathon`, `registerForHackathon`, `unregisterFromHackathon`, `listParticipants`, `listHackathonProblems`, `addProblemToHackathon`, `removeProblemFromHackathon` |
| `services/team.service.ts` | `listTeams`, `getTeamById`, `createTeam`, `updateTeam`, `deleteTeam`, `listTeamMembers`, `inviteMember`, `respondToInvitation`, `removeMember` |
| `services/project.service.ts` | `listProjects`, `getProjectById`, `createProject`, `updateProject`, `deleteProject`, `submitProject` |
| `services/evaluation.service.ts` | `listCriteria`, `createCriterion`, `assignJudge`, `unassignJudge`, `getJudgeProjects`, `getEvaluationsForProject`, `createEvaluation`, `updateEvaluation`, `getLeaderboard` |
| `services/impact.service.ts` | `listImpactByProject`, `listImpactByHackathon`, `createImpact`, `updateImpact` |
| `services/notification.service.ts` | `listNotifications`, `markAsRead`, `markAllAsRead`, `deleteNotification` |
| `services/admin.service.ts` | `adminDashboard`, `adminListUsers`, `adminUpdateUser`, `adminDeleteUser`, `adminList` |

### Phase 7 — API Route Handlers (all routes from docs/10_API_SPECIFICATION.md)

**Profiles**
- `GET /api/profiles/me`
- `PATCH /api/profiles/me`

**Problems**
- `GET /api/problems`
- `POST /api/problems`
- `GET /api/problems/:id`
- `PATCH /api/problems/:id`
- `DELETE /api/problems/:id`
- `GET /api/problems/:id/comments`
- `POST /api/problems/:id/comments`
- `POST /api/problems/:id/vote`
- `DELETE /api/problems/:id/vote`

**Hackathons**
- `GET /api/hackathons`
- `POST /api/hackathons`
- `GET /api/hackathons/:id`
- `PATCH /api/hackathons/:id`
- `DELETE /api/hackathons/:id`
- `POST /api/hackathons/:id/register`
- `DELETE /api/hackathons/:id/register`
- `GET /api/hackathons/:id/participants`
- `GET /api/hackathons/:id/problems`
- `POST /api/hackathons/:id/problems`
- `DELETE /api/hackathons/:id/problems/:problemId`
- `POST /api/hackathons/:id/judges`
- `DELETE /api/hackathons/:id/judges/:judgeId`
- `GET /api/hackathons/:id/leaderboard`
- `GET /api/hackathons/:id/impact`

**Teams**
- `GET /api/teams`
- `POST /api/teams`
- `GET /api/teams/:id`
- `PATCH /api/teams/:id`
- `DELETE /api/teams/:id`
- `POST /api/teams/:id/invite`
- `GET /api/teams/:id/members`
- `DELETE /api/teams/:id/members/:userId`

**Invitations**
- `POST /api/invitations/:id/accept`
- `POST /api/invitations/:id/reject`

**Projects**
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/projects/:id/submit`
- `GET /api/projects/:id/evaluation`
- `POST /api/projects/:id/evaluation`
- `GET /api/projects/:id/impact`
- `POST /api/projects/:id/impact`

**Evaluation**
- `PATCH /api/evaluations/:id`
- `GET /api/judges/me/projects`

**Impact**
- `PATCH /api/impact/:id`

**Notifications**
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `DELETE /api/notifications/:id`

**Admin**
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/hackathons`
- `GET /api/admin/problems`
- `GET /api/admin/teams`
- `GET /api/admin/projects`
- `GET /api/admin/evaluations`

### Phase 8 — Unit Tests
- `tests/unit/authorization.test.ts` — 3 role-authorization tests.
- `tests/unit/profile.test.ts` — 13 profile schema tests.
- `tests/unit/business-rules.test.ts` — 52 tests covering all critical rules:
  - BR-001 authentication guard
  - BR-002 hackathon management permissions (full role matrix)
  - BR-003 team creation permissions
  - BR-005 max_team_size 1–10 validation
  - Hackathon date ordering (registration ≤ start < end)
  - Team name validation (empty-after-trim, max 100 chars)
  - Project schema (empty title/desc, URLs, status injection blocked)
  - Project submission schema (document_url URL validation)
  - BR-010 score non-negative, evaluation requires ≥1 score
  - Full role permission matrix (ADMIN/JUDGE/ORGANIZER/PARTICIPANT)
  - Impact status enum and people_benefited ≥ 0
  - Comment content validation
  - Problem status enum and empty field rejection

**Total: 68 unit tests — all passing. TypeScript: clean. ESLint: clean (0 errors).**

---

## 🔲 Remaining / Future Work

- **Apply migration `20260906000002_problem_votes.sql`** to the linked Supabase project (`supabase db push`).
- **Seed data** (`docs/18_SEED_DATA.md`) — dev-only idempotent seed script.
- **Playwright E2E tests** — critical flows: sign-up → create hackathon → register → create team → submit project → evaluate → leaderboard.
- **Storage integration** — file upload for `project_submissions.document_url` and `problems.image_url` using Supabase Storage (private bucket + signed URLs).
- **Frontend integration** — frontend consumes all API routes above.
- **Deployment** — configure production environment variables, run `supabase db push` on prod project, deploy Next.js app.

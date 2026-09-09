/**
 * Business-rule unit tests.
 * Covers all critical rules listed in docs/17_TESTING_STRATEGY.md using
 * pure schema / logic checks — no Supabase connection needed.
 */
import { describe, expect, it } from 'vitest';

import {
  canPerformRoleAction,
  ForbiddenError,
  requireRoleAction,
  UnauthenticatedError,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { createHackathonSchema } from '@/types/hackathon';
import { createTeamSchema, updateTeamSchema } from '@/types/team';
import { createProjectSchema, updateProjectSchema, submitProjectSchema } from '@/types/project';
import {
  createEvaluationSchema,
  scoreInputSchema,
} from '@/types/evaluation';
import { createImpactSchema, updateImpactSchema } from '@/types/impact';
import { createCommentSchema, createProblemSchema, updateProblemSchema } from '@/types/problem';

// ─── BR-001 · Authentication required ────────────────────────────────────────
describe('BR-001 requireAuthenticatedActor', () => {
  it('throws UnauthenticatedError when actor is null', () => {
    expect(() => requireAuthenticatedActor(null)).toThrow(UnauthenticatedError);
  });

  it('returns actor when present', () => {
    const actor = { id: '550e8400-e29b-41d4-a716-446655440000', role: 'PARTICIPANT' as const };
    expect(requireAuthenticatedActor(actor)).toBe(actor);
  });
});

// ─── BR-002 · Hackathon creation — ORGANIZER / ADMIN only ────────────────────
describe('BR-002 hackathon management permissions', () => {
  it('ORGANIZER can manage hackathons', () => {
    expect(canPerformRoleAction('ORGANIZER', 'MANAGE_HACKATHONS')).toBe(true);
  });
  it('ADMIN can manage hackathons', () => {
    expect(canPerformRoleAction('ADMIN', 'MANAGE_HACKATHONS')).toBe(true);
  });
  it('PARTICIPANT cannot manage hackathons', () => {
    expect(canPerformRoleAction('PARTICIPANT', 'MANAGE_HACKATHONS')).toBe(false);
  });
  it('JUDGE cannot manage hackathons', () => {
    expect(canPerformRoleAction('JUDGE', 'MANAGE_HACKATHONS')).toBe(false);
  });
  it('requireRoleAction throws ForbiddenError for PARTICIPANT', () => {
    expect(() =>
      requireRoleAction({ id: '550e8400-e29b-41d4-a716-446655440000', role: 'PARTICIPANT' }, 'MANAGE_HACKATHONS'),
    ).toThrow(ForbiddenError);
  });
});

// ─── BR-002/003 · Team creation — PARTICIPANT only ───────────────────────────
describe('BR-003 team creation permissions', () => {
  it('PARTICIPANT can create/join teams', () => {
    expect(canPerformRoleAction('PARTICIPANT', 'CREATE_OR_JOIN_TEAM')).toBe(true);
  });
  it('ORGANIZER cannot create/join teams', () => {
    expect(canPerformRoleAction('ORGANIZER', 'CREATE_OR_JOIN_TEAM')).toBe(false);
  });
  it('JUDGE cannot create/join teams', () => {
    expect(canPerformRoleAction('JUDGE', 'CREATE_OR_JOIN_TEAM')).toBe(false);
  });
});

// ─── BR-005 · max_team_size 1–10 validation ──────────────────────────────────
describe('BR-005 max_team_size constraint (hackathon schema)', () => {
  const base = {
    title: 'Test Hackathon',
    description: 'desc',
    registration_deadline: '2027-01-01T00:00:00Z',
    start_date: '2027-01-02T00:00:00Z',
    end_date: '2027-01-03T00:00:00Z',
  };

  it('accepts max_team_size = 1', () => {
    expect(createHackathonSchema.safeParse({ ...base, max_team_size: 1 }).success).toBe(true);
  });
  it('accepts max_team_size = 10', () => {
    expect(createHackathonSchema.safeParse({ ...base, max_team_size: 10 }).success).toBe(true);
  });
  it('rejects max_team_size = 0', () => {
    expect(createHackathonSchema.safeParse({ ...base, max_team_size: 0 }).success).toBe(false);
  });
  it('rejects max_team_size = 11', () => {
    expect(createHackathonSchema.safeParse({ ...base, max_team_size: 11 }).success).toBe(false);
  });
  it('rejects non-integer max_team_size', () => {
    expect(createHackathonSchema.safeParse({ ...base, max_team_size: 3.5 }).success).toBe(false);
  });
});

// ─── Deadline ordering ────────────────────────────────────────────────────────
describe('Hackathon date ordering', () => {
  const goodDates = {
    registration_deadline: '2027-01-01T00:00:00Z',
    start_date: '2027-01-02T00:00:00Z',
    end_date: '2027-01-03T00:00:00Z',
  };
  const base = { title: 'H', description: 'D', max_team_size: 3 };

  it('accepts valid date ordering', () => {
    expect(createHackathonSchema.safeParse({ ...base, ...goodDates }).success).toBe(true);
  });
  it('rejects registration_deadline after start_date', () => {
    const r = createHackathonSchema.safeParse({
      ...base,
      registration_deadline: '2027-01-05T00:00:00Z',
      start_date: '2027-01-02T00:00:00Z',
      end_date: '2027-01-06T00:00:00Z',
    });
    expect(r.success).toBe(false);
  });
  it('rejects start_date after end_date', () => {
    const r = createHackathonSchema.safeParse({
      ...base,
      registration_deadline: '2027-01-01T00:00:00Z',
      start_date: '2027-01-04T00:00:00Z',
      end_date: '2027-01-03T00:00:00Z',
    });
    expect(r.success).toBe(false);
  });
});

// ─── Team name validation ─────────────────────────────────────────────────────
describe('Team name validation', () => {
  it('rejects empty team name after trim', () => {
    expect(createTeamSchema.safeParse({ hackathon_id: '550e8400-e29b-41d4-a716-446655440000', name: '   ' }).success).toBe(false);
  });
  it('rejects team name > 100 chars', () => {
    expect(createTeamSchema.safeParse({ hackathon_id: '550e8400-e29b-41d4-a716-446655440000', name: 'a'.repeat(101) }).success).toBe(false);
  });
  it('accepts valid team name', () => {
    expect(createTeamSchema.safeParse({ hackathon_id: '550e8400-e29b-41d4-a716-446655440000', name: 'Team Alpha' }).success).toBe(true);
  });
  it('trims team name whitespace', () => {
    const r = updateTeamSchema.safeParse({ name: '  Team Beta  ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe('Team Beta');
  });
});

// ─── Project submission ───────────────────────────────────────────────────────
describe('Project schema validation', () => {
  const validProject = {
    team_id: '550e8400-e29b-41d4-a716-446655440000',
    problem_id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'My Project',
    description: 'A description',
  };

  it('accepts valid project', () => {
    expect(createProjectSchema.safeParse(validProject).success).toBe(true);
  });
  it('rejects empty title', () => {
    expect(createProjectSchema.safeParse({ ...validProject, title: '' }).success).toBe(false);
  });
  it('rejects empty description', () => {
    expect(createProjectSchema.safeParse({ ...validProject, description: '   ' }).success).toBe(false);
  });
  it('rejects invalid github_url', () => {
    expect(createProjectSchema.safeParse({ ...validProject, github_url: 'not-a-url' }).success).toBe(false);
  });
  it('accepts null github_url', () => {
    expect(createProjectSchema.safeParse({ ...validProject, github_url: null }).success).toBe(true);
  });
  it('accepts valid github_url', () => {
    expect(createProjectSchema.safeParse({ ...validProject, github_url: 'https://github.com/user/repo' }).success).toBe(true);
  });
  it('rejects update to submitted project — status field not in update schema', () => {
    // updateProjectSchema does NOT include status — callers cannot change it via PATCH
    const r = updateProjectSchema.safeParse({ status: 'SUBMITTED', title: 'New' } as Record<string, unknown>);
    expect(r.success).toBe(true);
    if (r.success) expect((r.data as Record<string, unknown>)['status']).toBeUndefined();
  });
  it('submitProjectSchema accepts empty body', () => {
    expect(submitProjectSchema.safeParse({}).success).toBe(true);
  });
  it('submitProjectSchema rejects invalid document_url', () => {
    expect(submitProjectSchema.safeParse({ document_url: 'not-a-url' }).success).toBe(false);
  });
});

// ─── BR-010 · Score limits ────────────────────────────────────────────────────
describe('BR-010 evaluation score constraints', () => {
  it('rejects negative score', () => {
    expect(scoreInputSchema.safeParse({ criterion_id: '550e8400-e29b-41d4-a716-446655440000', score: -1 }).success).toBe(false);
  });
  it('accepts score = 0', () => {
    expect(scoreInputSchema.safeParse({ criterion_id: '550e8400-e29b-41d4-a716-446655440000', score: 0 }).success).toBe(true);
  });
  it('accepts positive score', () => {
    expect(scoreInputSchema.safeParse({ criterion_id: '550e8400-e29b-41d4-a716-446655440000', score: 9.5 }).success).toBe(true);
  });
  it('evaluation requires at least one score', () => {
    const r = createEvaluationSchema.safeParse({ scores: [] });
    expect(r.success).toBe(false);
  });
  it('accepts valid evaluation input', () => {
    const r = createEvaluationSchema.safeParse({
      feedback: 'Great work',
      scores: [{ criterion_id: '550e8400-e29b-41d4-a716-446655440000', score: 8 }],
    });
    expect(r.success).toBe(true);
  });
});

// ─── Role permissions — complete matrix ──────────────────────────────────────
describe('Role permission matrix', () => {
  it('ADMIN has all permissions', () => {
    const actions = [
      'PUBLIC_READ', 'SUBMIT_PROBLEM', 'MANAGE_HACKATHONS', 'REGISTER_HACKATHON',
      'CREATE_OR_JOIN_TEAM', 'SUBMIT_PROJECT', 'EVALUATE_ASSIGNED_PROJECT',
      'MANAGE_USERS', 'MANAGE_OWN_CONTENT', 'MANAGE_ALL_CONTENT',
    ] as const;
    for (const action of actions) {
      expect(canPerformRoleAction('ADMIN', action)).toBe(true);
    }
  });

  it('JUDGE can only read and evaluate', () => {
    expect(canPerformRoleAction('JUDGE', 'PUBLIC_READ')).toBe(true);
    expect(canPerformRoleAction('JUDGE', 'EVALUATE_ASSIGNED_PROJECT')).toBe(true);
    expect(canPerformRoleAction('JUDGE', 'SUBMIT_PROBLEM')).toBe(false);
    expect(canPerformRoleAction('JUDGE', 'MANAGE_HACKATHONS')).toBe(false);
    expect(canPerformRoleAction('JUDGE', 'CREATE_OR_JOIN_TEAM')).toBe(false);
    expect(canPerformRoleAction('JUDGE', 'MANAGE_USERS')).toBe(false);
  });

  it('ORGANIZER can manage hackathons and own content but not evaluate or manage users', () => {
    expect(canPerformRoleAction('ORGANIZER', 'MANAGE_HACKATHONS')).toBe(true);
    expect(canPerformRoleAction('ORGANIZER', 'MANAGE_OWN_CONTENT')).toBe(true);
    expect(canPerformRoleAction('ORGANIZER', 'EVALUATE_ASSIGNED_PROJECT')).toBe(false);
    expect(canPerformRoleAction('ORGANIZER', 'MANAGE_USERS')).toBe(false);
    expect(canPerformRoleAction('ORGANIZER', 'SUBMIT_PROBLEM')).toBe(false);
  });

  it('PARTICIPANT can submit but not manage or evaluate', () => {
    expect(canPerformRoleAction('PARTICIPANT', 'SUBMIT_PROBLEM')).toBe(true);
    expect(canPerformRoleAction('PARTICIPANT', 'REGISTER_HACKATHON')).toBe(true);
    expect(canPerformRoleAction('PARTICIPANT', 'CREATE_OR_JOIN_TEAM')).toBe(true);
    expect(canPerformRoleAction('PARTICIPANT', 'SUBMIT_PROJECT')).toBe(true);
    expect(canPerformRoleAction('PARTICIPANT', 'MANAGE_HACKATHONS')).toBe(false);
    expect(canPerformRoleAction('PARTICIPANT', 'EVALUATE_ASSIGNED_PROJECT')).toBe(false);
    expect(canPerformRoleAction('PARTICIPANT', 'MANAGE_USERS')).toBe(false);
    expect(canPerformRoleAction('PARTICIPANT', 'MANAGE_ALL_CONTENT')).toBe(false);
  });
});

// ─── Impact schema ────────────────────────────────────────────────────────────
describe('Impact record validation', () => {
  it('rejects negative people_benefited', () => {
    expect(createImpactSchema.safeParse({ people_benefited: -1 }).success).toBe(false);
  });
  it('accepts zero people_benefited', () => {
    expect(createImpactSchema.safeParse({ people_benefited: 0 }).success).toBe(true);
  });
  it('defaults status to PLANNED', () => {
    const r = createImpactSchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.status).toBe('PLANNED');
  });
  it('rejects invalid impact status', () => {
    expect(updateImpactSchema.safeParse({ status: 'UNKNOWN' }).success).toBe(false);
  });
  it('accepts all valid impact statuses', () => {
    for (const s of ['PLANNED', 'IN_PROGRESS', 'IMPLEMENTED', 'DISCONTINUED']) {
      expect(updateImpactSchema.safeParse({ status: s }).success).toBe(true);
    }
  });
});

// ─── Comment content validation ───────────────────────────────────────────────
describe('Comment validation', () => {
  it('rejects empty comment', () => {
    expect(createCommentSchema.safeParse({ content: '   ' }).success).toBe(false);
  });
  it('rejects comment > 2000 chars', () => {
    expect(createCommentSchema.safeParse({ content: 'x'.repeat(2001) }).success).toBe(false);
  });
  it('accepts valid comment', () => {
    expect(createCommentSchema.safeParse({ content: 'Good idea!' }).success).toBe(true);
  });
});

// ─── Problem status enum ──────────────────────────────────────────────────────
describe('Problem schema', () => {
  it('rejects invalid status', () => {
    expect(updateProblemSchema.safeParse({ status: 'ARCHIVED' }).success).toBe(false);
  });
  it('accepts valid problem statuses', () => {
    for (const s of ['OPEN', 'SELECTED', 'IN_PROGRESS', 'SOLVED', 'CLOSED']) {
      expect(updateProblemSchema.safeParse({ status: s }).success).toBe(true);
    }
  });
  it('rejects problem with empty title', () => {
    expect(createProblemSchema.safeParse({ title: '', description: 'desc' }).success).toBe(false);
  });
  it('rejects problem with empty description', () => {
    expect(createProblemSchema.safeParse({ title: 'Title', description: '  ' }).success).toBe(false);
  });
});

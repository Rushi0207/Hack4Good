import { describe, expect, it } from 'vitest';

import {
  ForbiddenError,
  canPerformRoleAction,
  requireRoleAction,
} from '@/lib/auth/authorization';

describe('role authorization', () => {
  it('allows participants to submit projects but not manage hackathons', () => {
    expect(canPerformRoleAction('PARTICIPANT', 'SUBMIT_PROJECT')).toBe(true);
    expect(canPerformRoleAction('PARTICIPANT', 'MANAGE_HACKATHONS')).toBe(false);
  });

  it('allows only judges and administrators to evaluate assigned projects', () => {
    expect(canPerformRoleAction('JUDGE', 'EVALUATE_ASSIGNED_PROJECT')).toBe(true);
    expect(canPerformRoleAction('ADMIN', 'EVALUATE_ASSIGNED_PROJECT')).toBe(true);
    expect(
      canPerformRoleAction('ORGANIZER', 'EVALUATE_ASSIGNED_PROJECT'),
    ).toBe(false);
  });

  it('rejects a forbidden role action', () => {
    expect(() =>
      requireRoleAction(
        { id: '794a50c4-1b98-43f4-9b81-4c1f50c6bbf5', role: 'PARTICIPANT' },
        'MANAGE_HACKATHONS',
      ),
    ).toThrow(ForbiddenError);
  });
});

import { describe, expect, it } from 'vitest';

import { updateProfileSchema, profileSchema } from '@/types/profile';

// ─── updateProfileSchema ──────────────────────────────────────────────────────

describe('updateProfileSchema', () => {
  it('accepts a valid partial update with all fields', () => {
    const result = updateProfileSchema.safeParse({
      full_name: '  Alice Smith  ',
      bio: 'Loves hackathons.',
      skills: ['TypeScript', 'React'],
      location: 'Nairobi',
      image_url: 'https://example.com/avatar.png',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // trim is applied
      expect(result.data.full_name).toBe('Alice Smith');
    }
  });

  it('accepts an empty object (no-op update)', () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects full_name that is empty after trimming', () => {
    const result = updateProfileSchema.safeParse({ full_name: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects full_name longer than 200 characters', () => {
    const result = updateProfileSchema.safeParse({ full_name: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects bio longer than 2000 characters', () => {
    const result = updateProfileSchema.safeParse({ bio: 'x'.repeat(2001) });
    expect(result.success).toBe(false);
  });

  it('accepts null bio to clear the field', () => {
    const result = updateProfileSchema.safeParse({ bio: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.bio).toBeNull();
  });

  it('rejects more than 30 skills', () => {
    const result = updateProfileSchema.safeParse({
      skills: Array.from({ length: 31 }, (_, i) => `skill-${i}`),
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid image_url', () => {
    const result = updateProfileSchema.safeParse({ image_url: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('accepts null image_url to clear the field', () => {
    const result = updateProfileSchema.safeParse({ image_url: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.image_url).toBeNull();
  });

  it('rejects unknown keys by stripping them (Zod default strip)', () => {
    const result = updateProfileSchema.safeParse({ role: 'ADMIN', full_name: 'Bob' });
    expect(result.success).toBe(true);
    if (result.success) {
      // role must not leak through
      expect((result.data as Record<string, unknown>)['role']).toBeUndefined();
    }
  });
});

// ─── profileSchema ────────────────────────────────────────────────────────────

describe('profileSchema', () => {
  // Use a proper RFC 4122 v4 UUID (version digit = 4, variant bits = 8-b)
  const validProfile = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    full_name: 'Alice',
    role: 'PARTICIPANT',
    bio: null,
    skills: [],
    location: null,
    image_url: null,
    created_at: '2026-09-08T00:00:00Z',
    updated_at: '2026-09-08T00:00:00Z',
  };

  it('parses a valid profile', () => {
    const result = profileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid role value', () => {
    const result = profileSchema.safeParse({ ...validProfile, role: 'SUPERUSER' });
    expect(result.success).toBe(false);
  });

  it('rejects a non-uuid id', () => {
    const result = profileSchema.safeParse({ ...validProfile, id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { type Profile, profileSchema, type UpdateProfileInput } from '@/types/profile';

/**
 * Retrieves the profile for the given user id.
 * Returns null when no profile row exists.
 */
export async function getProfileById(userId: string): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, bio, skills, location, image_url, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const result = profileSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Applies a partial profile update for the given user.
 * Callers are responsible for authorization before invoking this function.
 * Returns the updated profile, or null if the update failed.
 */
export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();

  // Build only the fields that were actually supplied to avoid overwriting
  // fields the caller did not intend to change.
  const patch: Record<string, unknown> = {};

  if (input.full_name !== undefined) patch['full_name'] = input.full_name;
  if (input.bio !== undefined) patch['bio'] = input.bio;
  if (input.skills !== undefined) patch['skills'] = input.skills;
  if (input.location !== undefined) patch['location'] = input.location;
  if (input.image_url !== undefined) patch['image_url'] = input.image_url;

  if (Object.keys(patch).length === 0) {
    // Nothing to update — return the current profile.
    return getProfileById(userId);
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('id, full_name, role, bio, skills, location, image_url, created_at, updated_at')
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const result = profileSchema.safeParse(data);
  return result.success ? result.data : null;
}

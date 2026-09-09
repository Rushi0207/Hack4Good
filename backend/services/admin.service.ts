import { createSupabaseServerClient } from '@/lib/supabase/server';
import { type UserRole } from '@/types/auth';

export async function adminDashboard() {
  const supabase = await createSupabaseServerClient();

  const [users, hackathons, problems, teams, projects] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('hackathons').select('id', { count: 'exact', head: true }),
    supabase.from('problems').select('id', { count: 'exact', head: true }),
    supabase.from('teams').select('id', { count: 'exact', head: true }),
    supabase.from('projects').select('id', { count: 'exact', head: true }),
  ]);

  return {
    total_users: users.count ?? 0,
    total_hackathons: hackathons.count ?? 0,
    total_problems: problems.count ?? 0,
    total_teams: teams.count ?? 0,
    total_projects: projects.count ?? 0,
  };
}

export async function adminListUsers(opts: { limit: number; offset: number }) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, location, image_url, created_at')
    .order('created_at', { ascending: false })
    .range(opts.offset, opts.offset + opts.limit - 1);

  if (error || !data) return [];
  return data;
}

export async function adminUpdateUser(
  id: string,
  patch: { role?: UserRole; full_name?: string },
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', id)
    .select('id, full_name, role, created_at')
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function adminDeleteUser(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  return !error;
}

export async function adminList(
  table: 'hackathons' | 'problems' | 'teams' | 'projects' | 'evaluations',
  opts: { limit: number; offset: number },
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })
    .range(opts.offset, opts.offset + opts.limit - 1);

  if (error || !data) return [];
  return data;
}

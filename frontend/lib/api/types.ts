/**
 * Shared TypeScript types — exact mirrors of backend Zod schemas.
 * Field names must match DB column names exactly.
 */

// ─── Auth / Profile ───────────────────────────────────────────────────────────

export type UserRole = 'PARTICIPANT' | 'ORGANIZER' | 'JUDGE' | 'ADMIN'

export interface Profile {
  id: string
  full_name: string
  email?: string           // not in profiles table; read from auth.users
  role: UserRole
  bio: string | null
  skills: string[]
  location: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface UpdateProfileInput {
  full_name?: string
  bio?: string | null
  skills?: string[]
  location?: string | null
  image_url?: string | null
}

// ─── Problems ────────────────────────────────────────────────────────────────

export type ProblemStatus = 'OPEN' | 'SELECTED' | 'IN_PROGRESS' | 'SOLVED' | 'CLOSED'

export interface Problem {
  id: string
  title: string
  description: string
  category: string | null
  location: string | null
  expected_impact: string | null
  image_url: string | null
  status: ProblemStatus
  created_by: string          // backend column name (not creator_id)
  created_at: string
  updated_at: string
  // vote_count is NOT returned by the backend (stored in problem_votes table)
}

export interface CreateProblemInput {
  title: string
  description: string
  category?: string | null
  location?: string | null
  expected_impact?: string | null
  image_url?: string | null
}

export interface UpdateProblemInput {
  title?: string
  description?: string
  category?: string | null
  location?: string | null
  expected_impact?: string | null
  image_url?: string | null
  status?: ProblemStatus
}

export interface Comment {
  id: string
  problem_id: string
  user_id: string             // backend column name (not author_id)
  content: string
  created_at: string
}

export interface CreateCommentInput {
  content: string
}

export interface ProblemListQuery {
  status?: ProblemStatus
  category?: string
  location?: string
}

// ─── Hackathons ───────────────────────────────────────────────────────────────

export type HackathonStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'

export interface Hackathon {
  id: string
  title: string
  description: string
  theme: string | null
  rules: string | null
  location: string | null
  registration_deadline: string
  start_date: string
  end_date: string
  max_team_size: number
  status: HackathonStatus
  created_by: string          // backend column name (not manager_id)
  created_at: string
  updated_at: string
}

export interface CreateHackathonInput {
  title: string
  description: string
  theme?: string | null
  rules?: string | null
  location?: string | null
  registration_deadline: string
  start_date: string
  end_date: string
  max_team_size: number
}

export interface UpdateHackathonInput {
  title?: string
  description?: string
  theme?: string | null
  rules?: string | null
  location?: string | null
  status?: HackathonStatus
  registration_deadline?: string
  start_date?: string
  end_date?: string
  max_team_size?: number
}

export interface Participant {
  user_id: string
  hackathon_id: string
  registered_at: string
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export interface Team {
  id: string
  hackathon_id: string
  name: string
  description: string | null
  leader_id: string
  created_at: string
  updated_at: string
}

export interface CreateTeamInput {
  hackathon_id: string
  name: string
  description?: string | null
}

export interface UpdateTeamInput {
  name?: string
  description?: string | null
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  joined_at: string
}

export interface TeamInvitation {
  id: string
  team_id: string
  user_id: string             // backend column name (invitee)
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  created_at: string
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export type ProjectStatus = 'DRAFT' | 'SUBMITTED'   // only 2 statuses in backend

export interface Project {
  id: string
  team_id: string
  problem_id: string          // required in backend schema
  title: string
  description: string
  technologies: string[]      // backend column name (not tech_stack)
  impact: string | null
  github_url: string | null   // backend column name (not repository_url)
  demo_url: string | null
  status: ProjectStatus
  created_at: string
  updated_at: string
  // hackathon_id is NOT in the projects table; it comes from teams join
}

export interface CreateProjectInput {
  team_id: string
  problem_id: string
  title: string
  description: string
  technologies?: string[]
  impact?: string | null
  github_url?: string | null
  demo_url?: string | null
}

export interface UpdateProjectInput {
  title?: string
  description?: string
  technologies?: string[]
  impact?: string | null
  github_url?: string | null
  demo_url?: string | null
}

// ─── Evaluations ──────────────────────────────────────────────────────────────

export interface Evaluation {
  id: string
  project_id: string
  judge_id: string
  total_score: number | null
  feedback: string | null
  created_at: string
  updated_at: string
}

export interface EvaluationScore {
  criterion_id: string
  score: number
}

export interface CreateEvaluationInput {
  scores: EvaluationScore[]
  feedback?: string
}

export interface UpdateEvaluationInput {
  scores?: EvaluationScore[]
  feedback?: string | null
}

export interface LeaderboardEntry {
  rank: number
  team_id: string
  team_name: string
  total_score: number
  project_id: string
  project_title: string
}

// ─── Impact ───────────────────────────────────────────────────────────────────

export type ImpactStatus = 'PLANNED' | 'IN_PROGRESS' | 'ACHIEVED'

export interface ImpactRecord {
  id: string
  project_id: string
  hackathon_id: string | null
  description: string
  people_benefited: number
  status: ImpactStatus
  created_at: string
  updated_at: string
}

export interface CreateImpactInput {
  description: string
  people_benefited: number
  status?: ImpactStatus
}

export interface UpdateImpactInput {
  description?: string
  people_benefited?: number
  status?: ImpactStatus
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  user_id: string
  type: string
  message: string
  read_at: string | null      // backend column (nullable ISO timestamp, NOT boolean)
  created_at: string
}

/** Helper: is notification unread? */
export function isUnread(n: Notification): boolean {
  return n.read_at === null
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminDashboard {
  total_users: number
  total_hackathons: number
  total_problems: number
  total_teams: number
  total_projects: number
  // note: evaluations is not returned by the backend adminDashboard()
}

import { api } from './client'
import type {
  AdminDashboard,
  Evaluation,
  Hackathon,
  Problem,
  Profile,
  Project,
  Team,
  UserRole,
} from './types'

export const adminApi = {
  dashboard(): Promise<AdminDashboard> {
    return api.get('/api/admin/dashboard')
  },

  listUsers(): Promise<Profile[]> {
    return api.get('/api/admin/users')
  },

  updateUser(id: string, input: { name?: string; role?: UserRole }): Promise<Profile> {
    return api.patch(`/api/admin/users/${id}`, input)
  },

  deleteUser(id: string): Promise<void> {
    return api.delete(`/api/admin/users/${id}`)
  },

  listHackathons(): Promise<Hackathon[]> {
    return api.get('/api/admin/hackathons')
  },

  listProblems(): Promise<Problem[]> {
    return api.get('/api/admin/problems')
  },

  listTeams(): Promise<Team[]> {
    return api.get('/api/admin/teams')
  },

  listProjects(): Promise<Project[]> {
    return api.get('/api/admin/projects')
  },

  listEvaluations(): Promise<Evaluation[]> {
    return api.get('/api/admin/evaluations')
  },
}

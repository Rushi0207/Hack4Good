import { api } from './client'
import type {
  CreateHackathonInput,
  Hackathon,
  ImpactRecord,
  LeaderboardEntry,
  Participant,
  Problem,
  UpdateHackathonInput,
} from './types'

export const hackathonsApi = {
  list(status?: string): Promise<Hackathon[]> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : ''
    return api.get(`/api/hackathons${qs}`)
  },

  get(id: string): Promise<Hackathon> {
    return api.get(`/api/hackathons/${id}`)
  },

  create(input: CreateHackathonInput): Promise<Hackathon> {
    return api.post('/api/hackathons', input)
  },

  update(id: string, input: UpdateHackathonInput): Promise<Hackathon> {
    return api.patch(`/api/hackathons/${id}`, input)
  },

  delete(id: string): Promise<void> {
    return api.delete(`/api/hackathons/${id}`)
  },

  register(id: string): Promise<void> {
    return api.post(`/api/hackathons/${id}/register`)
  },

  unregister(id: string): Promise<void> {
    return api.delete(`/api/hackathons/${id}/register`)
  },

  listParticipants(id: string): Promise<Participant[]> {
    return api.get(`/api/hackathons/${id}/participants`)
  },

  listProblems(id: string): Promise<Problem[]> {
    return api.get(`/api/hackathons/${id}/problems`)
  },

  addProblem(id: string, problemId: string): Promise<void> {
    return api.post(`/api/hackathons/${id}/problems`, { problem_id: problemId })
  },

  removeProblem(id: string, problemId: string): Promise<void> {
    return api.delete(`/api/hackathons/${id}/problems/${problemId}`)
  },

  assignJudge(id: string, userId: string): Promise<void> {
    return api.post(`/api/hackathons/${id}/judges`, { user_id: userId })
  },

  unassignJudge(id: string, judgeId: string): Promise<void> {
    return api.delete(`/api/hackathons/${id}/judges/${judgeId}`)
  },

  leaderboard(id: string): Promise<LeaderboardEntry[]> {
    return api.get(`/api/hackathons/${id}/leaderboard`)
  },

  impact(id: string): Promise<ImpactRecord[]> {
    return api.get(`/api/hackathons/${id}/impact`)
  },
}

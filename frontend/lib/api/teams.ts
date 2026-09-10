import { api } from './client'
import type {
  CreateTeamInput,
  Team,
  TeamInvitation,
  TeamMember,
  UpdateTeamInput,
} from './types'

export const teamsApi = {
  list(hackathonId?: string): Promise<Team[]> {
    const qs = hackathonId ? `?hackathon_id=${encodeURIComponent(hackathonId)}` : ''
    return api.get(`/api/teams${qs}`)
  },

  get(id: string): Promise<Team> {
    return api.get(`/api/teams/${id}`)
  },

  create(input: CreateTeamInput): Promise<Team> {
    return api.post('/api/teams', input)
  },

  update(id: string, input: UpdateTeamInput): Promise<Team> {
    return api.patch(`/api/teams/${id}`, input)
  },

  delete(id: string): Promise<void> {
    return api.delete(`/api/teams/${id}`)
  },

  invite(id: string, userId: string): Promise<TeamInvitation> {
    return api.post(`/api/teams/${id}/invite`, { user_id: userId })
  },

  listMembers(id: string): Promise<TeamMember[]> {
    return api.get(`/api/teams/${id}/members`)
  },

  removeMember(id: string, userId: string): Promise<void> {
    return api.delete(`/api/teams/${id}/members/${userId}`)
  },
}

export const invitationsApi = {
  accept(id: string): Promise<void> {
    return api.post(`/api/invitations/${id}/accept`)
  },

  reject(id: string): Promise<void> {
    return api.post(`/api/invitations/${id}/reject`)
  },
}

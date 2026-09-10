import { api } from './client'
import type {
  CreateEvaluationInput,
  CreateImpactInput,
  CreateProjectInput,
  Evaluation,
  ImpactRecord,
  Project,
  UpdateEvaluationInput,
  UpdateImpactInput,
  UpdateProjectInput,
} from './types'

export const projectsApi = {
  list(query?: { team_id?: string; hackathon_id?: string }): Promise<Project[]> {
    const params = new URLSearchParams()
    if (query?.team_id) params.set('team_id', query.team_id)
    if (query?.hackathon_id) params.set('hackathon_id', query.hackathon_id)
    const qs = params.toString() ? `?${params.toString()}` : ''
    return api.get(`/api/projects${qs}`)
  },

  get(id: string): Promise<Project> {
    return api.get(`/api/projects/${id}`)
  },

  create(input: CreateProjectInput): Promise<Project> {
    return api.post('/api/projects', input)
  },

  update(id: string, input: UpdateProjectInput): Promise<Project> {
    return api.patch(`/api/projects/${id}`, input)
  },

  delete(id: string): Promise<void> {
    return api.delete(`/api/projects/${id}`)
  },

  submit(id: string, documentUrl?: string): Promise<Project> {
    return api.post(`/api/projects/${id}/submit`, documentUrl ? { document_url: documentUrl } : {})
  },

  listEvaluations(id: string): Promise<Evaluation[]> {
    return api.get(`/api/projects/${id}/evaluation`)
  },

  createEvaluation(id: string, input: CreateEvaluationInput): Promise<Evaluation> {
    return api.post(`/api/projects/${id}/evaluation`, input)
  },

  listImpact(id: string): Promise<ImpactRecord[]> {
    return api.get(`/api/projects/${id}/impact`)
  },

  addImpact(id: string, input: CreateImpactInput): Promise<ImpactRecord> {
    return api.post(`/api/projects/${id}/impact`, input)
  },
}

export const evaluationsApi = {
  update(id: string, input: UpdateEvaluationInput): Promise<Evaluation> {
    return api.patch(`/api/evaluations/${id}`, input)
  },
}

export const judgesApi = {
  myProjects(): Promise<Project[]> {
    return api.get('/api/judges/me/projects')
  },
}

export const impactApi = {
  update(id: string, input: UpdateImpactInput): Promise<ImpactRecord> {
    return api.patch(`/api/impact/${id}`, input)
  },
}

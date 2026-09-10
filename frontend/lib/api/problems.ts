import { api } from './client'
import type {
  Comment,
  CreateProblemInput,
  Problem,
  ProblemListQuery,
  UpdateProblemInput,
} from './types'

export const problemsApi = {
  list(query?: ProblemListQuery): Promise<Problem[]> {
    const params = new URLSearchParams()
    if (query?.status) params.set('status', query.status)
    if (query?.category) params.set('category', query.category)
    if (query?.location) params.set('location', query.location)
    const qs = params.toString() ? `?${params.toString()}` : ''
    return api.get(`/api/problems${qs}`)
  },

  get(id: string): Promise<Problem> {
    return api.get(`/api/problems/${id}`)
  },

  create(input: CreateProblemInput): Promise<Problem> {
    return api.post('/api/problems', input)
  },

  update(id: string, input: UpdateProblemInput): Promise<Problem> {
    return api.patch(`/api/problems/${id}`, input)
  },

  delete(id: string): Promise<void> {
    return api.delete(`/api/problems/${id}`)
  },

  listComments(id: string): Promise<Comment[]> {
    return api.get(`/api/problems/${id}/comments`)
  },

  addComment(id: string, content: string): Promise<Comment> {
    return api.post(`/api/problems/${id}/comments`, { content })
  },

  vote(id: string): Promise<void> {
    return api.post(`/api/problems/${id}/vote`)
  },

  unvote(id: string): Promise<void> {
    return api.delete(`/api/problems/${id}/vote`)
  },
}

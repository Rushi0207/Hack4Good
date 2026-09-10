import { api } from './client'
import type { Profile, UpdateProfileInput } from './types'

export const profileApi = {
  me(): Promise<Profile> {
    return api.get('/api/profiles/me')
  },

  update(input: UpdateProfileInput): Promise<Profile> {
    return api.patch('/api/profiles/me', input)
  },
}

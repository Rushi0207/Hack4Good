import { api } from './client'
import type { Notification } from './types'

export const notificationsApi = {
  list(): Promise<Notification[]> {
    return api.get('/api/notifications')
  },

  markRead(id: string): Promise<Notification> {
    return api.patch(`/api/notifications/${id}/read`)
  },

  markAllRead(): Promise<void> {
    return api.patch('/api/notifications/read-all')
  },

  delete(id: string): Promise<void> {
    return api.delete(`/api/notifications/${id}`)
  },
}

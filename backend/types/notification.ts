import { z } from 'zod';

export const notificationSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  type: z.string(),
  message: z.string(),
  read_at: z.string().nullable(),
  created_at: z.string(),
});
export type Notification = z.infer<typeof notificationSchema>;

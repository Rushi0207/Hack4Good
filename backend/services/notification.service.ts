import { createSupabaseServerClient } from '@/lib/supabase/server';
import { type Notification, notificationSchema } from '@/types/notification';

const NOTIF_FIELDS = 'id, user_id, type, message, read_at, created_at';

export async function listNotifications(userId: string): Promise<Notification[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('notifications')
    .select(NOTIF_FIELDS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data.map((row) => notificationSchema.parse(row));
}

export async function markAsRead(
  id: string,
  userId: string,
): Promise<Notification | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select(NOTIF_FIELDS)
    .maybeSingle();

  if (error || !data) return null;
  const result = notificationSchema.safeParse(data);
  return result.success ? result.data : null;
}

export async function markAllAsRead(userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
  return !error;
}

export async function deleteNotification(id: string, userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  return !error;
}

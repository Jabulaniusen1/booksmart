import { useAppStore } from '@/lib/store';
import { db } from '@/lib/supabase';
import { useEffect } from 'react';

export function useNotificationCount() {
  const { user, setUnreadNotificationCount } = useAppStore();

  useEffect(() => {
    const loadNotificationCount = async () => {
      if (!user) {
        setUnreadNotificationCount(0);
        return;
      }

      try {
        const { data: count, error } = await db.getUnreadNotificationCount(user.id);
        if (!error) {
          setUnreadNotificationCount(count);
        }
      } catch (error) {
        console.error('Failed to load notification count:', error);
      }
    };

    loadNotificationCount();
  }, [user, setUnreadNotificationCount]);
}

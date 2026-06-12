'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUnreadCount } from '@/app/(app)/chat/actions';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = React.createContext<NotificationContextType>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
});

export const useNotifications = () => React.useContext(NotificationContext);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [userId, setUserId] = React.useState<string | null>(null);

  const fetchUnreadCount = React.useCallback(async () => {
    const res = await getUnreadCount();
    if (res && typeof res.count === 'number') {
      setUnreadCount(res.count);
    }
  }, []);

  React.useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchUnreadCount();
      }
    }
    init();
  }, [fetchUnreadCount]);

  React.useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    
    // Listen for new messages or updates to messages
    const channel = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${userId}`
        },
        () => {
          // Re-fetch the count instead of manually maintaining state to avoid race conditions
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount: fetchUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { GroupMessageItem, sendGroupMessage, getGroupMessages } from '@/app/(app)/coach/group/[id]/group-chat-actions';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Send, X, MessageSquare, Loader2 } from 'lucide-react';

interface GroupChatPanelProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function GroupChatPanel({ groupId, isOpen, onClose }: GroupChatPanelProps) {
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<GroupMessageItem[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Fetch initial messages & current user
  React.useEffect(() => {
    if (!isOpen) return;

    const fetchMessages = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      const { data, error } = await getGroupMessages(groupId);
      if (data) {
        setMessages(data);
      }
      setLoading(false);
    };

    fetchMessages();
  }, [groupId, isOpen]);

  // Supabase Realtime subscription
  React.useEffect(() => {
    if (!isOpen) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`group_${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          // If the message is ours, we already optimistic updated it.
          if (payload.new.sender_id === currentUserId) return;
          
          // We need to fetch the profile info for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, role')
            .eq('id', payload.new.sender_id)
            .single();

          const newMsg = {
            ...payload.new,
            profiles: profile || null
          } as GroupMessageItem;

          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, isOpen, currentUserId]);

  // Scroll to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !currentUserId) return;

    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic update
    const tempMsg: GroupMessageItem = {
      id: 'temp-' + Date.now(),
      group_id: groupId,
      sender_id: currentUserId,
      message: text,
      created_at: new Date().toISOString(),
      profiles: { first_name: 'Tú', last_name: '', role: null }
    };
    setMessages(prev => [...prev, tempMsg]);

    const { data, error } = await sendGroupMessage(groupId, text);
    
    if (data) {
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? data : m));
    } else {
      // Revert if error
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      console.error(error);
    }
    setSending(false);
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white border-l border-zinc-200 shadow-2xl z-[100] flex flex-col transform transition-transform duration-300">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-cyan-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900">Chat de Grupo</h2>
            <p className="text-[10px] text-zinc-500 font-medium">Comunicación en tiempo real</p>
          </div>
        </div>
        <AnimatedButton variant="ghost" size="icon" onClick={onClose} className="text-zinc-500 hover:text-zinc-800">
          <X className="w-5 h-5" />
        </AnimatedButton>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-zinc-50/50 space-y-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-2">
            <MessageSquare className="w-8 h-8 text-zinc-300" />
            <p className="text-sm">No hay mensajes aún.</p>
            <p className="text-xs">¡Sé el primero en saludar al grupo!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === currentUserId;
            const isCoach = msg.profiles?.role === 'coach';
            const showName = i === 0 || messages[i - 1].sender_id !== msg.sender_id;

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {showName && !isMe && (
                  <span className={`text-[10px] font-bold mb-1 ml-1 ${isCoach ? 'text-amber-600' : 'text-zinc-500'}`}>
                    {msg.profiles?.first_name} {isCoach && '⭐'}
                  </span>
                )}
                <div 
                  className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                    isMe 
                      ? 'bg-cyan-600 text-white rounded-tr-sm' 
                      : isCoach 
                        ? 'bg-amber-100 text-amber-900 border border-amber-200 rounded-tl-sm'
                        : 'bg-white text-zinc-800 border border-zinc-200 rounded-tl-sm'
                  }`}
                >
                  <p className="break-words leading-relaxed">{msg.message}</p>
                </div>
                <span className="text-[9px] text-zinc-400 mt-1 font-medium px-1">
                  {formatTime(msg.created_at)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-zinc-100">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2.5 bg-zinc-100 border-transparent focus:border-cyan-500 focus:bg-white rounded-full text-sm outline-none transition-all"
          />
          <AnimatedButton 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </AnimatedButton>
        </form>
      </div>
    </div>
  );
}

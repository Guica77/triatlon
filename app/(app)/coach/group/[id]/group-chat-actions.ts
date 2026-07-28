'use server';

import { createClient } from '@/lib/supabase/server';

export interface GroupMessageItem {
  id: string;
  group_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    role: string | null;
  } | null;
}

export async function sendGroupMessage(groupId: string, message: string): Promise<{ data?: GroupMessageItem; error?: string }> {
  if (!message || !message.trim()) {
    return { error: 'El mensaje no puede estar vacío' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  try {
    const { data: newMessage, error } = await supabase
      .from('group_messages')
      .insert({
        sender_id: user.id,
        group_id: groupId,
        message: message.trim(),
      })
      .select('*, profiles(first_name, last_name, role)')
      .single();

    if (error) {
      console.error('Error enviando mensaje de grupo:', error);
      return { error: error.message };
    }

    return { data: newMessage as any as GroupMessageItem };
  } catch (error: any) {
    console.error('Error sendGroupMessage:', error);
    return { error: 'Error interno enviando mensaje' };
  }
}

export async function getGroupMessages(groupId: string): Promise<{ data?: GroupMessageItem[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  try {
    const { data, error } = await supabase
      .from('group_messages')
      .select('*, profiles(first_name, last_name, role)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error fetching group messages:', error);
      return { error: error.message };
    }

    return { data: data as any[] as GroupMessageItem[] };
  } catch (err: any) {
    console.error('Error getGroupMessages:', err);
    return { error: 'Error obteniendo mensajes' };
  }
}

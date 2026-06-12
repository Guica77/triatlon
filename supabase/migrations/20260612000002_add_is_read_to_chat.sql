-- SQL Migration: Add is_read to chat_messages

ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Create an index to quickly find unread messages for a user
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON public.chat_messages(receiver_id, is_read);

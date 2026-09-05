-- Keyset pagination in both directions of a conversation. No message data is changed.
CREATE INDEX IF NOT EXISTS idx_chat_conversation_history
  ON public.chat_messages (sender_id, receiver_id, created_at DESC, id DESC);

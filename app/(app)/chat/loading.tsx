import { ChatViewport } from '@/components/chat/chat-viewport'
import { ChatLoadingState } from '@/components/chat/chat-loading-state'

export default function ChatLoading() {
  return <ChatViewport><ChatLoadingState /></ChatViewport>
}

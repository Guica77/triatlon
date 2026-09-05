'use client'

import * as React from 'react'
import { mergeMessages, restoreOutbox, type PendingMessage } from '@/lib/chat-messages'
import { ChatLoadingState } from '@/components/chat/chat-loading-state'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Search, 
  MessageSquare, 
  ChevronRight, 
  ArrowLeft,
  Sparkles,
  Plus,
  Smile,
  Paperclip,
  Mic,
  MoreVertical
} from 'lucide-react'
import { AnimatedButton } from '@/components/ui/animated-button'
import { ChatParticipant, ChatMessageItem, sendMessage, getMessages, linkCoachByAthlete, linkCoachByCode, markMessagesAsRead } from '@/app/(app)/chat/actions'
import { createClient } from '@/lib/supabase/client'
import { useNotifications } from '@/components/providers/notification-provider'
import { useReducedMotion } from 'framer-motion'

interface ChatViewProps {
  initialParticipants: ChatParticipant[]
  currentUserRole: 'coach' | 'athlete'
  currentUserId: string
  preselectedParticipantId?: string | null
  availableCoaches?: ChatParticipant[]
}

export function ChatView({ 
  initialParticipants, 
  currentUserRole, 
  currentUserId,
  preselectedParticipantId,
  availableCoaches = []
}: ChatViewProps) {
  const [participants, setParticipants] = React.useState<ChatParticipant[]>(initialParticipants)
  const [selectedPart, setSelectedPart] = React.useState<ChatParticipant | null>(null)
  const [messages, setMessages] = React.useState<ChatMessageItem[]>([])
  const [newMessageText, setNewMessageText] = React.useState('')
  const [loadingMessages, setLoadingMessages] = React.useState(false)
  const [historyError, setHistoryError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isTyping, setIsTyping] = React.useState(false)
  const [linkingCoachId, setLinkingCoachId] = React.useState<string | null>(null)
  const [inviteCode, setInviteCode] = React.useState('')
  const [linkingCoachCode, setLinkingCoachCode] = React.useState(false)

  const selectedIdRef = React.useRef<string | null>(null)
  const messagesRef = React.useRef(messages)
  React.useEffect(() => { messagesRef.current = messages }, [messages])
  const syncedMessageRef = React.useRef<string | null>(null)
  const historyRequestRef = React.useRef(0)
  const [hasMore, setHasMore] = React.useState(false)
  const [loadingOlder, setLoadingOlder] = React.useState(false)
  const [outbox, setOutbox] = React.useState<PendingMessage[]>([])
  const outboxRef = React.useRef<PendingMessage[]>([])
  const sendingRef = React.useRef(new Set<string>())
  const [storageWarning, setStorageWarning] = React.useState(false)
  const outboxKey = `triatlon-chat-outbox:${currentUserId}`
  const saveOutbox = (rows: PendingMessage[]) => {
    outboxRef.current = rows
    setOutbox(rows)
    try { localStorage.setItem(outboxKey, JSON.stringify(rows)); setStorageWarning(false) }
    catch { setStorageWarning(true) }
  }
  React.useEffect(() => {
    try {
      const restored = restoreOutbox(localStorage.getItem(outboxKey), currentUserId)
      outboxRef.current = restored
      setOutbox(restored)
    } catch { setStorageWarning(true) }
  }, [outboxKey, currentUserId])
  const visibleMessages = mergeMessages(
    outbox.filter(m => m.receiver_id === selectedPart?.id), messages,
  )

  const messagesListRef = React.useRef<HTMLDivElement>(null)

  const { refreshUnreadCount } = useNotifications()
  const reduceMotion = useReducedMotion()
  const hasSidebar = currentUserRole === 'coach' || participants.length > 1

  // Filtered sidebar items
  const filteredParticipants = participants.filter(p => {
    const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  // Select participant and fetch history
  const handleSelectParticipant = async (part: ChatParticipant) => {
    selectedIdRef.current = part.id
    const requestId = ++historyRequestRef.current
    setHasMore(false)
    setLoadingOlder(false)
    setSelectedPart(part)
    setLoadingMessages(true)
    setHistoryError(null)
    syncedMessageRef.current = null
    messagesRef.current = []
    setMessages([])
    
    try {
      const res = await getMessages(part.id)
      if (requestId !== historyRequestRef.current || selectedIdRef.current !== part.id) return
      if (res.error) throw new Error(res.error)
      if (res.data) {
        setMessages(prev => mergeMessages(prev, res.data!))
        setHasMore(!!res.hasMore)
        syncedMessageRef.current = res.data.at(-1)?.id || null
        saveOutbox(outboxRef.current.filter(m => !res.data!.some(saved => saved.id === m.id)))
      }
      
      // Mark messages from this participant as read
      await markMessagesAsRead(part.id)
      await refreshUnreadCount()
    } catch (err) {
      if (requestId !== historyRequestRef.current || selectedIdRef.current !== part.id) return
      setHistoryError('No se pudo cargar el historial. Reinténtalo para ver tus mensajes.')
      console.error('Error fetching chat messages:', err)
    } finally {
      if (requestId === historyRequestRef.current) setLoadingMessages(false)
    }
  }

  // Pre-select participant if passed in props
  React.useEffect(() => {
    if (preselectedParticipantId && initialParticipants.length > 0) {
      const found = initialParticipants.find(p => p.id === preselectedParticipantId)
      if (found) {
        handleSelectParticipant(found)
      }
    } else if (initialParticipants.length > 0 && currentUserRole === 'athlete') {
      // For athletes, preselect their only coach automatically
      handleSelectParticipant(initialParticipants[0])
    }
  }, [preselectedParticipantId, initialParticipants]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    const list = messagesListRef.current
    list?.scrollTo({ top: list.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [visibleMessages.at(-1)?.id, isTyping])

  const loadOlderMessages = async () => {
    if (!selectedPart || !messages.length || loadingOlder) return
    const partId = selectedPart.id
    const requestId = historyRequestRef.current
    setLoadingOlder(true)
    try {
      const res = await getMessages(partId, messages[0])
      if (selectedIdRef.current !== partId || requestId !== historyRequestRef.current) return
      if (res.error) throw new Error(res.error)
      const list = messagesListRef.current
      const oldHeight = list?.scrollHeight || 0
      const oldTop = list?.scrollTop || 0
      setMessages(prev => mergeMessages(res.data || [], prev))
      setHasMore(!!res.hasMore)
      setHistoryError(null)
      requestAnimationFrame(() => {
        if (list && selectedIdRef.current === partId) list.scrollTop = oldTop + list.scrollHeight - oldHeight
      })
    } catch { if (selectedIdRef.current === partId && requestId === historyRequestRef.current) setHistoryError('No se pudieron cargar los mensajes anteriores. Puedes reintentar.') }
    finally { if (selectedIdRef.current === partId) setLoadingOlder(false) }
  }

  React.useEffect(() => {
    if (!selectedPart) return
    const partId = selectedPart.id
    let active = true
    let refreshing = false
    const refresh = async () => {
      if (refreshing || document.visibilityState === 'hidden') return
      refreshing = true
      const lastSyncedId = syncedMessageRef.current
      try {
        const res = await getMessages(partId)
        if (!active || selectedIdRef.current !== partId) return
        if (res.error) { setHistoryError('No se pudo actualizar la conversación. Reintentaremos al reconectar.'); return }
        let recovered = res.data || []
        let page = res
        const known = messagesRef.current
        // Catch up across more than one page after a long disconnection.
        while (lastSyncedId && page.hasMore && page.data?.length &&
          !recovered.some(m => m.id === lastSyncedId)) {
          page = await getMessages(partId, page.data[0])
          if (!active || selectedIdRef.current !== partId) return
          if (page.error) throw new Error(page.error)
          recovered = mergeMessages(page.data || [], recovered)
        }
        syncedMessageRef.current = res.data?.at(-1)?.id || lastSyncedId
        if (!known.length) setHasMore(!!res.hasMore)
        setMessages(prev => mergeMessages(prev, recovered))
        setHistoryError(null)
        saveOutbox(outboxRef.current.filter(m => !recovered.some(saved => saved.id === m.id)))
        await markMessagesAsRead(partId)
        await refreshUnreadCount()
      } catch { if (active) setHistoryError('Sin conexión. Tus mensajes guardados siguen en el historial.') }
      finally { refreshing = false }
    }
    const supabase = createClient()
    const receive = (payload: { new: unknown }) => {
      const message = payload.new as ChatMessageItem
      if (!active || selectedIdRef.current !== partId) return
      if (!((message.sender_id === partId && message.receiver_id === currentUserId) ||
        (message.sender_id === currentUserId && message.receiver_id === partId))) return
      setMessages(prev => mergeMessages(prev, [message]))
      saveOutbox(outboxRef.current.filter(m => m.id !== message.id))
      if (message.receiver_id === currentUserId) void refresh()
    }
    const channel = supabase.channel(`chat_${currentUserId}_${partId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `receiver_id=eq.${currentUserId}` }, receive)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `sender_id=eq.${currentUserId}` }, receive)
      .subscribe(status => { if (status === 'SUBSCRIBED') void refresh() })
    window.addEventListener('online', refresh)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    const interval = window.setInterval(refresh, 30000)
    return () => {
      active = false
      supabase.removeChannel(channel)
      window.clearInterval(interval)
      window.removeEventListener('online', refresh)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [currentUserId, selectedPart?.id])

  const deliverMessage = async (pending: PendingMessage) => {
    if (sendingRef.current.has(pending.id)) return
    sendingRef.current.add(pending.id)
    saveOutbox([...outboxRef.current.filter(m => m.id !== pending.id), { ...pending, delivery: 'sending' }])
    try {
      const res = await sendMessage(pending.receiver_id, pending.message, pending.id)
      if (res.error || !res.data) throw new Error(res.error || 'No se pudo confirmar el envío')
      if (selectedIdRef.current === pending.receiver_id) setMessages(prev => mergeMessages(prev, [res.data!]))
      saveOutbox(outboxRef.current.filter(m => m.id !== pending.id))
    } catch {
      saveOutbox(outboxRef.current.map(m => m.id === pending.id ? { ...m, delivery: 'failed' } : m))
    } finally { sendingRef.current.delete(pending.id) }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessageText.trim() || !selectedPart) return
    const pending: PendingMessage = {
      id: crypto.randomUUID(), sender_id: currentUserId, receiver_id: selectedPart.id,
      message: newMessageText.trim(), created_at: new Date().toISOString(), delivery: 'sending',
    }
    setNewMessageText('')
    await deliverMessage(pending)
  }

  const handleLinkCoach = async (coachId: string) => {
    setLinkingCoachId(coachId)
    const res = await linkCoachByAthlete(coachId)
    if (res.success) {
      window.location.reload()
    } else {
      alert(res.error || 'Error al vincular con el entrenador')
      setLinkingCoachId(null)
    }
  }

  const handleLinkByCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return

    setLinkingCoachCode(true)
    const res = await linkCoachByCode(inviteCode)
    if (res.success) {
      window.location.reload()
    } else {
      alert(res.error || 'Código inválido o error al vincular')
      setLinkingCoachCode(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-none border border-border-subtle bg-surface-elevated shadow-card sm:rounded-2xl">
      
      {/* Left Sidebar */}
      {hasSidebar ? (
        <div className={`w-full shrink-0 border-border-default bg-surface-app sm:w-80 sm:border-r ${selectedPart ? 'hidden sm:flex' : 'flex'} flex-col`}>

          {/* Search bar */}
          <div className="flex items-center gap-2 border-b border-border-subtle bg-surface-elevated p-3 sm:p-4">
            <div className="flex w-full items-center gap-2 rounded-xl border border-border-default bg-surface-card px-3 py-2 shadow-card">
              <Search className="h-4 w-4 shrink-0 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar conversación..."
                className="w-full border-none bg-transparent text-xs text-text-primary outline-none placeholder:text-text-muted"
              />
            </div>
          </div>

          {/* List */}
          <div className="custom-scrollbar flex-1 divide-y divide-border-subtle overflow-y-auto">
            {filteredParticipants.length === 0 ? (
              <div className="p-6 text-center text-xs font-semibold text-text-muted">
                No hay contactos disponibles
              </div>
            ) : (
              filteredParticipants.map(p => {
                const isSelected = selectedPart?.id === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectParticipant(p)}
                    className={`flex min-h-11 w-full items-center justify-between p-4 text-left transition-[background-color,border-color,color,opacity,box-shadow,transform] duration-150 ease-out active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-swim/50 focus-visible:ring-inset motion-reduce:transition-opacity motion-reduce:active:scale-100 ${
                      isSelected
                        ? 'bg-swim-subtle/70 border-l-2 border-swim'
                        : 'fine-hover:bg-surface-hover'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border-default bg-surface-card text-xs font-bold text-text-secondary">
                        {(p.first_name || 'T')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate text-xs font-bold text-text-primary">
                          {p.first_name || 'Triatleta'} {p.last_name || ''}
                        </span>
                        <span className="block truncate text-[10px] font-medium text-text-muted">
                          {p.role === 'coach' ? 'Entrenador Personal' : 'Atleta de Roster'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                  </button>
                )
              })
            )}
          </div>
        </div>
      ) : null}

      {/* Main Chat Conversation Viewport */}
      <div className={`flex min-h-0 min-w-0 flex-1 flex-col justify-between bg-surface-elevated ${hasSidebar && !selectedPart ? 'hidden sm:flex' : 'flex'}`}>
        {selectedPart ? (
          <>
            {/* Active chat header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border-default bg-surface-card px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-center gap-3">
                {hasSidebar && (
                  <button 
                    onClick={() => { selectedIdRef.current = null; historyRequestRef.current++; setSelectedPart(null) }}
                    className="sm:hidden min-h-10 min-w-10 -ml-1 shrink-0 rounded-lg text-text-secondary transition-[color,background-color,opacity,transform] duration-150 ease-out active:scale-[0.97] fine-hover:bg-surface-hover fine-hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-swim/50"
                    aria-label="Volver"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-swim/40 bg-swim-subtle text-xs font-bold text-swim">
                  {(selectedPart.first_name || 'T')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-text-primary">
                    {selectedPart.first_name || 'Triatleta'} {selectedPart.last_name || ''}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1 text-[9px] font-medium text-text-muted">
                    Historial guardado en tu cuenta
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-3">
                {/* Realtime badge (hidden on narrow screens to save space for call buttons) */}
                <div className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-success/30 bg-bike-subtle px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-bike sm:flex sm:text-[9px]">
                  <Sparkles className="h-3 w-3 animate-pulse text-bike" />
                  <span className="hidden sm:inline">Mensajes</span>
                  <span className="sm:hidden">Mensajes</span>
                </div>
                
                <div className="flex shrink-0 items-center">
                  <button type="button" className="min-h-10 min-w-10 rounded-xl p-2 text-text-muted transition-[color,background-color,opacity,transform] duration-150 ease-out active:scale-[0.97] fine-hover:bg-surface-hover fine-hover:text-swim cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-swim/50" aria-label="Opciones">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Chat Conversation Viewport */}
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-bg-deep">
              {/* Messages body list */}
              <div ref={messagesListRef} className="custom-scrollbar relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4 sm:p-6">
                {storageWarning && <p role="alert" className="mb-3 text-sm text-warning">No se pueden guardar los pendientes en este dispositivo. No cierres el chat hasta confirmar el envío.</p>}
                {historyError && visibleMessages.length > 0 && <p role="alert" className="mb-3 text-sm text-warning">{historyError}</p>}
                {hasMore && <button type="button" disabled={loadingOlder} onClick={loadOlderMessages} className="mb-4 min-h-11 shrink-0 rounded-xl bg-surface-card px-4 text-sm text-text-secondary">{loadingOlder ? 'Cargando…' : 'Ver mensajes anteriores'}</button>}
                {loadingMessages && visibleMessages.length === 0 ? (
                  <ChatLoadingState />
                ) : historyError && visibleMessages.length === 0 ? (
                  <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-text-muted">
                    <p>{historyError}</p>
                    <button type="button" onClick={() => handleSelectParticipant(selectedPart)} className="min-h-11 rounded-xl bg-surface-card px-4 text-text-primary">Reintentar</button>
                  </div>
                ) : visibleMessages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center space-y-2 text-text-muted">
                    <MessageSquare className="h-8 w-8 text-swim" />
                    <p className="text-xs font-bold text-text-secondary">No hay mensajes previos.</p>
                    <p className="text-[10px] font-semibold text-text-muted">¡Escribe tu primer mensaje!</p>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1">
                    {visibleMessages.map(m => {
                      const pending = !messages.some(saved => saved.id === m.id) ? outbox.find(item => item.id === m.id) : undefined
                      const isOwn = m.sender_id === currentUserId
                      return (
                        <div 
                          key={m.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}
                        >
                          <motion.div
                            initial={reduceMotion ? false : { opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
                            className={`max-w-[80%] sm:max-w-[70%] px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed shadow-sm relative ${
                              isOwn
                                ? 'bg-coral-500 text-text-inverse font-medium rounded-tr-sm border border-coral-400 shadow-button'
                                : 'bg-surface-card text-text-primary rounded-tl-sm border border-border-default font-medium'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{m.message}</p>
                            {isOwn ? (
                              <div className="float-right ml-3 mt-0.5 flex translate-y-1 items-center justify-end gap-1 text-[9px] font-bold text-text-inverse/70" suppressHydrationWarning>
                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {pending?.delivery === 'failed' ? (
                                  <button type="button" onClick={() => deliverMessage(pending)} className="min-h-11 px-2 underline">No enviado · Reintentar</button>
                                ) : <span>{pending ? 'Enviando…' : m.is_read ? 'Leído' : 'Guardado'}</span>}
                              </div>
                            ) : (
                              <div className="float-right ml-3 mt-0.5 translate-y-1 text-right text-[9px] font-bold text-text-muted" suppressHydrationWarning>
                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                            <div className="clear-both"></div>
                          </motion.div>
                        </div>
                      )
                    })}

                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-none border border-border-default bg-surface-card p-3.5 text-text-muted shadow-card">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-swim [animation-delay:0ms]" />
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-swim [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-swim [animation-delay:300ms]" />
                        </div>
                      </div>
                    )}

                    <div className="h-2" />
                  </div>
                )}
              </div>
            </div>

            {/* Input form */}
            <form 
              onSubmit={handleSendMessage}
              className="z-10 flex shrink-0 items-end gap-2 border-t border-border-default bg-surface-elevated p-2 pb-[calc(0.5rem+var(--chat-bottom-inset,env(safe-area-inset-bottom)))] shadow-[0_-6px_18px_rgba(0,0,0,0.18)] sm:p-3"
            >
              {/* Attachment Icon */}
              <button 
                type="button" 
                className="min-h-10 min-w-10 shrink-0 rounded-xl p-2 text-text-muted transition-[color,background-color,opacity,transform] duration-150 ease-out active:scale-[0.97] fine-hover:bg-surface-hover fine-hover:text-coral-400 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500/50"
                aria-label="Adjuntar archivo"
              >
                <Plus className="w-5 h-5" />
              </button>
              
              {/* Input container wrapper */}
              <div className="flex min-h-[40px] flex-1 items-end rounded-2xl border border-border-default bg-surface-card px-1.5 py-1 shadow-card">
                {/* Emoji Icon */}
                <button 
                  type="button" 
                  className="min-h-10 min-w-10 shrink-0 p-2 text-text-muted transition-[color,background-color,opacity,transform] duration-150 ease-out active:scale-[0.97] fine-hover:text-text-secondary cursor-pointer self-end mb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-swim/50"
                  aria-label="Emojis"
                >
                  <Smile className="w-5 h-5" />
                </button>
                
                <textarea
                  value={newMessageText}
                  onChange={(e) => {
                    setNewMessageText(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onFocus={() => {
                    setTimeout(() => scrollToBottom(), 150);
                  }}
                  aria-label="Mensaje"
                  placeholder="Mensaje..."
                  rows={1}
                  className="min-h-[36px] max-h-[120px] w-full resize-none self-center border-none bg-transparent px-1 py-2 text-base text-text-primary outline-none placeholder:text-text-muted custom-scrollbar"
                />
                
                {/* Paperclip Icon */}
                <button 
                  type="button" 
                  className="min-h-10 min-w-10 shrink-0 p-2 text-text-muted transition-[color,background-color,opacity,transform] duration-150 ease-out active:scale-[0.97] fine-hover:text-text-secondary cursor-pointer self-end mb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-swim/50"
                  aria-label="Compartir documento"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>
              
              {/* Send or Voice Record Icon */}
              {newMessageText.trim() ? (
                <AnimatedButton
                  type="submit"
                  variant="primary"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl !bg-primary !text-primary-foreground shadow-button transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-out active:scale-[0.97] cursor-pointer self-end mb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500/50"
                >
                  <Send className="ml-0.5 h-4 w-4 text-primary-foreground" />
                </AnimatedButton>
              ) : (
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl !bg-secondary !text-secondary-foreground shadow-button transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-out active:scale-[0.97] cursor-pointer self-end mb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-swim/50"
                  aria-label="Grabar audio"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </form>
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center bg-bg-deep p-6">
            {currentUserRole === 'coach' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-swim/40 bg-swim-subtle text-swim shadow-card">
                  <MessageSquare className="h-8 w-8 text-swim" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-text-primary">Centro de Mensajería</h3>
                  <p className="mt-2 max-w-sm text-sm font-medium leading-relaxed text-text-muted">
                    Selecciona un atleta del roster en el panel izquierdo para ver su historial y comenzar a conversar.
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto max-h-[100%] pr-2 custom-scrollbar">
                <div className="mb-8 mt-4 space-y-2 text-center">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-coral-500/40 bg-run-subtle text-coral-300 shadow-card">
                    <Sparkles className="h-6 w-6 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight text-text-primary">Directorio de Entrenadores</h3>
                  <p className="mx-auto max-w-md text-sm font-medium leading-relaxed text-text-muted">
                    Aún no tienes un entrenador asignado. Vincula tu cuenta mediante un código de invitación o elige un coach certificado.
                  </p>
                </div>
                
                {/* Código de invitación */}
                <form onSubmit={handleLinkByCode} className="mx-auto flex max-w-sm flex-col gap-3 rounded-2xl border border-border-default bg-surface-card p-5 text-left shadow-card">
                  <label className="text-center text-[10px] font-black uppercase tracking-wider text-text-muted">¿Tienes un código de entrenador?</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                      placeholder="Ej: GUILLEPRO"
                      className="flex-1 rounded-xl border border-border-default bg-surface-elevated px-4 py-3 text-sm font-black uppercase tracking-wider text-text-primary outline-none transition-[background-color,color,border-color,box-shadow] duration-150 ease-out placeholder:text-text-muted focus:border-swim focus-visible:ring-2 focus-visible:ring-swim/30"
                    />
                    <AnimatedButton
                      type="submit"
                      variant="primary"
                      disabled={linkingCoachCode || !inviteCode.trim()}
                      className="min-h-10 cursor-pointer px-6 py-3 text-sm font-black !bg-primary !text-primary-foreground shadow-button transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {linkingCoachCode ? '...' : 'Vincular'}
                    </AnimatedButton>
                  </div>
                </form>
 
                <div className="relative py-4 max-w-sm mx-auto">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-subtle"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-bg-deep px-4 text-xs font-bold uppercase tracking-wide text-text-muted">o elige uno disponible</span>
                  </div>
                </div>

                {availableCoaches.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12 text-left">
                    {availableCoaches.map(coach => (
                      <div key={coach.id} className="group flex flex-col justify-between rounded-2xl border border-border-default bg-surface-card p-5 shadow-card transition-[border-color,box-shadow,background-color] duration-150 ease-out fine-hover:border-swim/50">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border-default bg-surface-elevated text-lg font-bold text-text-secondary shadow-card">
                            {(coach.first_name || 'E')[0].toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-text-primary transition-colors fine-hover:group-hover:text-swim">
                              {coach.first_name} {coach.last_name}
                            </h4>
                            <span className="mt-1 inline-block rounded-md border border-success/30 bg-bike-subtle px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-bike">
                              Entrenador Certificado
                            </span>
                          </div>
                        </div>
                        <AnimatedButton
                          variant="primary"
                          className="w-full cursor-pointer border border-border-default !bg-surface-elevated text-xs font-black !text-text-primary shadow-card transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out fine-hover:!bg-surface-hover fine-hover:border-swim/50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-swim/50"
                          disabled={linkingCoachId === coach.id}
                          onClick={() => handleLinkCoach(coach.id)}
                        >
                          {linkingCoachId === coach.id ? 'Vinculando...' : 'Elegir como Entrenador'}
                        </AnimatedButton>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border-default bg-surface-card p-8 pb-12 text-center font-medium shadow-card">
                    <p className="text-sm text-text-muted">No hay entrenadores disponibles en este momento.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}

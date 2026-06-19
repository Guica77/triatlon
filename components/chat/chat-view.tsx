'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Search, 
  MessageSquare, 
  ChevronRight, 
  ArrowLeft,
  Sparkles
} from 'lucide-react'
import { AnimatedButton } from '@/components/ui/animated-button'
import { ChatParticipant, ChatMessageItem, sendMessage, getMessages, linkCoachByAthlete, linkCoachByCode, markMessagesAsRead } from '@/app/(app)/chat/actions'
import { createClient } from '@/lib/supabase/client'
import { useNotifications } from '@/components/providers/notification-provider'

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
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isTyping, setIsTyping] = React.useState(false)
  const [linkingCoachId, setLinkingCoachId] = React.useState<string | null>(null)
  const [inviteCode, setInviteCode] = React.useState('')
  const [linkingCoachCode, setLinkingCoachCode] = React.useState(false)

  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const { refreshUnreadCount } = useNotifications()

  // Filtered sidebar items
  const filteredParticipants = participants.filter(p => {
    const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  // Select participant and fetch history
  const handleSelectParticipant = async (part: ChatParticipant) => {
    setSelectedPart(part)
    setLoadingMessages(true)
    setMessages([])
    
    try {
      const res = await getMessages(part.id)
      if (res.data) {
        setMessages(res.data)
      }
      
      // Mark messages from this participant as read
      await markMessagesAsRead(part.id)
      await refreshUnreadCount()
    } catch (err) {
      console.error('Error fetching chat messages:', err)
    } finally {
      setLoadingMessages(false)
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Supabase Realtime Subscription
  React.useEffect(() => {
    if (!currentUserId || !selectedPart) return

    const supabase = createClient()
    
    const channel = supabase
      .channel(`chat_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${currentUserId}`
        },
        (payload) => {
          const newMsg = payload.new as ChatMessageItem
          if (newMsg.sender_id === selectedPart.id) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, selectedPart])

  // Submit message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessageText.trim() || !selectedPart) return

    const messageText = newMessageText.trim()
    setNewMessageText('')

    // 1. Optimistic update
    const tempId = `temp-${Date.now()}`
    const optimisticMsg: ChatMessageItem = {
      id: tempId,
      sender_id: currentUserId,
      receiver_id: selectedPart.id,
      message: messageText,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, optimisticMsg])

    try {
      const res = await sendMessage(selectedPart.id, messageText)
      if (res.error) {
        setMessages(prev => prev.filter(m => m.id !== tempId))
        alert(res.error)
      } else if (res.data) {
        setMessages(prev => prev.map(m => m.id === tempId ? res.data! : m))
      }
    } catch (err) {
      console.error(err)
      setMessages(prev => prev.filter(m => m.id !== tempId))
    }
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
    <div className="flex bg-white border border-zinc-200 rounded-2xl overflow-hidden h-[calc(100vh-180px)] min-h-[500px] shadow-sm">
      
      {/* Left Sidebar */}
      {(currentUserRole === 'coach' || participants.length > 1) ? (
        <div className="w-80 border-r border-zinc-200 flex flex-col shrink-0 bg-zinc-50/50">
          
          {/* Search bar */}
          <div className="p-4 border-b border-zinc-200 flex items-center gap-2 bg-zinc-50">
            <div className="flex items-center gap-2 bg-white border border-zinc-200 px-3 py-1.5 rounded-xl w-full shadow-sm">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar conversación..."
                className="bg-transparent border-none text-xs text-zinc-800 outline-none w-full placeholder-zinc-400"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-200/60 custom-scrollbar">
            {filteredParticipants.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 font-semibold">
                No hay contactos disponibles
              </div>
            ) : (
              filteredParticipants.map(p => {
                const isSelected = selectedPart?.id === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectParticipant(p)}
                    className={`w-full p-4 flex items-center justify-between text-left transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-cyan-50/40 border-l-2 border-cyan-550' 
                        : 'hover:bg-zinc-100/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-xs text-zinc-700 shadow-sm shrink-0">
                        {(p.first_name || 'T')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-zinc-900 block truncate">
                          {p.first_name || 'Triatleta'} {p.last_name || ''}
                        </span>
                        <span className="text-[10px] text-zinc-500 block truncate font-medium">
                          {p.role === 'coach' ? 'Entrenador Personal' : 'Atleta de Roster'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  </button>
                )
              })
            )}
          </div>
        </div>
      ) : null}

      {/* Main Chat Conversation Viewport */}
      <div className="flex-1 flex flex-col justify-between bg-zinc-50/10">
        {selectedPart ? (
          <>
            {/* Active chat header */}
            <div className="px-6 py-4 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0">
                  {(selectedPart.first_name || 'T')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-900">
                    {selectedPart.first_name || 'Triatleta'} {selectedPart.last_name || ''}
                  </h3>
                  <p className="text-[9px] text-zinc-500 flex items-center gap-1 mt-0.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                    Chat Activo
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-[9px] text-emerald-700 font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
                Conectado (Realtime)
              </div>
            </div>

            {/* Messages body list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center text-xs text-zinc-500 font-semibold">
                  Cargando conversación...
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2">
                  <MessageSquare className="w-8 h-8 text-zinc-400" />
                  <p className="text-xs font-bold">No hay mensajes previos.</p>
                  <p className="text-[10px] text-zinc-450 font-semibold">¡Escribe tu primer mensaje!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(m => {
                    const isOwn = m.sender_id === currentUserId
                    return (
                      <div 
                        key={m.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                            isOwn 
                              ? 'bg-cyan-600 text-white font-bold rounded-tr-none' 
                              : 'bg-zinc-100 text-zinc-800 rounded-tl-none border border-zinc-200/60 font-semibold'
                          }`}
                        >
                          <p>{m.message}</p>
                          <span className={`text-[8px] mt-1.5 block text-right font-bold ${
                            isOwn ? 'text-white/80' : 'text-zinc-400'
                          }`}>
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </motion.div>
                      </div>
                    )
                  })}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-100 border border-zinc-200 text-zinc-500 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input form */}
            <form 
              onSubmit={handleSendMessage}
              className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-zinc-200 bg-white flex items-center gap-2 shrink-0 shadow-sm"
            >
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                onFocus={(e) => {
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 150);
                }}
                placeholder="Escribe tu mensaje aquí..."
                className="bg-white border border-zinc-200 focus:border-cyan-550 focus:ring-1 focus:ring-cyan-550 rounded-xl p-3 text-sm text-zinc-850 outline-none w-full transition-colors"
              />
              <AnimatedButton
                type="submit"
                variant="primary"
                size="icon"
                className="w-10 h-10 shrink-0 !bg-cyan-650 hover:!bg-cyan-550 !text-white rounded-xl shadow-md flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4 text-white" />
              </AnimatedButton>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center p-6 bg-zinc-50/10">
            {currentUserRole === 'coach' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-450 shadow-inner">
                  <MessageSquare className="w-8 h-8 text-zinc-500" />
                </div>
                <div>
                  <h3 className="text-zinc-800 font-black text-lg tracking-tight">Centro de Mensajería</h3>
                  <p className="text-sm text-zinc-500 font-medium max-w-sm mt-2 leading-relaxed">
                    Selecciona un atleta del roster en el panel izquierdo para ver su historial y comenzar a conversar.
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto max-h-[100%] pr-2 custom-scrollbar">
                <div className="text-center space-y-2 mb-8 mt-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 text-cyan-600 mb-4 shadow-sm">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 tracking-tight">Directorio de Entrenadores</h3>
                  <p className="text-sm text-zinc-500 font-medium max-w-md mx-auto leading-relaxed">
                    Aún no tienes un entrenador asignado. Vincula tu cuenta mediante un código de invitación o elige un coach certificado.
                  </p>
                </div>
                
                {/* Código de invitación */}
                <form onSubmit={handleLinkByCode} className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3 max-w-sm mx-auto text-left">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider text-center">¿Tienes un código de entrenador?</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                      placeholder="Ej: GUILLEPRO"
                      className="flex-1 bg-white border border-zinc-200 focus:border-cyan-550 rounded-xl px-4 py-3 text-sm text-cyan-700 font-black uppercase tracking-wider outline-none transition-all"
                    />
                    <AnimatedButton
                      type="submit"
                      variant="primary"
                      disabled={linkingCoachCode || !inviteCode.trim()}
                      className="px-6 py-3 text-sm font-black !bg-cyan-650 hover:!bg-cyan-550 !text-white shadow-md cursor-pointer"
                    >
                      {linkingCoachCode ? '...' : 'Vincular'}
                    </AnimatedButton>
                  </div>
                </form>
 
                <div className="relative py-4 max-w-sm mx-auto">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-xs font-bold text-zinc-450 uppercase tracking-wide">o elige uno disponible</span>
                  </div>
                </div>

                {availableCoaches.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12 text-left">
                    {availableCoaches.map(coach => (
                      <div key={coach.id} className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col justify-between hover:border-cyan-500/40 transition-all group shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center font-bold text-lg text-zinc-700 shadow-sm shrink-0">
                            {(coach.first_name || 'E')[0].toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-zinc-800 group-hover:text-cyan-600 transition-colors">
                              {coach.first_name} {coach.last_name}
                            </h4>
                            <span className="text-[10px] uppercase tracking-wider font-black text-emerald-700 bg-emerald-55 border border-emerald-150 px-2 py-0.5 rounded-md mt-1 inline-block">
                              Entrenador Certificado
                            </span>
                          </div>
                        </div>
                        <AnimatedButton
                          variant="primary"
                          className="w-full text-xs font-black !bg-zinc-50 hover:!bg-zinc-100 !text-zinc-750 border border-zinc-200 shadow-sm cursor-pointer"
                          disabled={linkingCoachId === coach.id}
                          onClick={() => handleLinkCoach(coach.id)}
                        >
                          {linkingCoachId === coach.id ? 'Vinculando...' : 'Elegir como Entrenador'}
                        </AnimatedButton>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-zinc-50 border border-zinc-200 rounded-2xl pb-12 font-medium">
                    <p className="text-sm text-zinc-500">No hay entrenadores disponibles en este momento.</p>
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

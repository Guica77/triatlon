import { AppleLoadingMark } from '@/components/brand/apple-loading-mark'

export function ChatLoadingState() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <AppleLoadingMark label="Cargando conversación" />
    </div>
  )
}

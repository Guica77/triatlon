'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'

/** Keep mobile conversations inside the visible area, including while iOS pans its keyboard. */
export function ChatViewport({ children }: { children: React.ReactNode }) {
  const [mobile, setMobile] = React.useState(false)
  const viewportRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)')
    const update = () => setMobile(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  React.useEffect(() => {
    if (!mobile) return
    const body = document.body
    const previousOverflow = body.style.overflow
    const previousRootOverflow = document.documentElement.style.overflow
    body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    const viewport = window.visualViewport
    const update = () => {
      const element = viewportRef.current
      if (!element) return
      const height = viewport?.height ?? window.innerHeight
      const keyboardOpen = window.innerHeight - height > 100
      element.style.height = `${height}px`
      element.style.top = `${viewport?.offsetTop ?? 0}px`
      element.style.setProperty('--chat-bottom-inset', keyboardOpen ? '0px' : 'env(safe-area-inset-bottom)')
    }
    update()
    viewport?.addEventListener('resize', update)
    viewport?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      body.style.overflow = previousOverflow
      document.documentElement.style.overflow = previousRootOverflow
      viewport?.removeEventListener('resize', update)
      viewport?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [mobile])

  const content = (
    <div ref={viewportRef} className={mobile
      ? 'fixed inset-x-0 top-0 z-[60] isolate flex h-dvh min-h-0 flex-col overflow-hidden bg-bg-deep pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]'
      : 'relative isolate flex h-[calc(100dvh-env(safe-area-inset-top))] min-h-0 flex-col overflow-hidden bg-bg-deep'}>
      {children}
    </div>
  )
  // Escape page-transition transforms, which otherwise become a fixed-position containing block.
  return mobile ? createPortal(content, document.body) : content
}

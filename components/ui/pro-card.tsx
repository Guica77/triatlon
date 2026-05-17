import * as React from "react"
import { cn } from "@/lib/utils"

const ProCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 overflow-hidden relative",
      "transition-all duration-300 ease-out",
      className
    )}
    {...props}
  />
))
ProCard.displayName = "ProCard"

export { ProCard }

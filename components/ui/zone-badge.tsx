import * as React from "react"
import { cn } from "@/lib/utils"

interface ZoneBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  zone: 1 | 2 | 3 | 4 | 5;
  label?: string;
}

const ZoneBadge = React.forwardRef<HTMLDivElement, ZoneBadgeProps>(
  ({ className, zone, label, ...props }, ref) => {
    
    const dotColors = {
      1: "bg-[var(--color-zone-1)]",
      2: "bg-[var(--color-zone-2)]",
      3: "bg-[var(--color-zone-3)]",
      4: "bg-[var(--color-zone-4)]",
      5: "bg-[var(--color-zone-5)]",
    }

    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center gap-2", className)}
        {...props}
      >
        <span className="text-xs font-medium text-zinc-400 tracking-wide uppercase">
          {label || `Z${zone}`}
        </span>
        <div className={cn("w-2 h-2 rounded-full", dotColors[zone])} />
      </div>
    )
  }
)
ZoneBadge.displayName = "ZoneBadge"

export { ZoneBadge }

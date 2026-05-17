"use client";

import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    
    const variants = {
      primary: "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90 font-medium",
      secondary: "bg-[var(--color-surface)] text-white border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]",
      danger: "bg-[var(--color-zone-5)] text-white font-medium",
      ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-[var(--color-surface)]",
    }

    const sizes = {
      sm: "h-9 px-4 text-xs",
      md: "h-12 px-6 text-sm",
      lg: "h-14 px-8 text-base",
      icon: "h-12 w-12 flex items-center justify-center rounded-xl",
    }

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "rounded-xl transition-opacity flex items-center justify-center gap-2",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    )
  }
)
AnimatedButton.displayName = "AnimatedButton"

export { AnimatedButton }

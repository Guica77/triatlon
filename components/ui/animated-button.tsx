"use client";

import * as React from "react"
import { motion, HTMLMotionProps, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
}

function useFinePointer() {
  const [canHover, setCanHover] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setCanHover(mediaQuery.matches);

    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  return canHover;
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, variant = "primary", size = "md", children, whileHover, whileTap, ...props }, ref) => {
    const canHover = useFinePointer();
    const reduceMotion = useReducedMotion();
    const hoverAnimation = whileHover ?? { scale: 1.01 };
    const tapAnimation = whileTap ?? { scale: 0.97 };

    const variants = {
      primary: "bg-primary text-primary-foreground fine-hover:opacity-90 font-medium",
      secondary: "bg-secondary text-secondary-foreground border border-border fine-hover:opacity-90",
      danger: "bg-destructive text-destructive-foreground font-medium fine-hover:opacity-90",
      ghost: "bg-transparent text-muted-foreground fine-hover:text-foreground fine-hover:bg-accent",
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
        whileHover={canHover && !reduceMotion ? hoverAnimation : undefined}
        whileTap={reduceMotion ? undefined : tapAnimation}
        transition={{ duration: reduceMotion ? 0.15 : 0.16, ease: "easeOut" }}
        className={cn(
          "min-h-9 rounded-xl transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-out flex items-center justify-center gap-2 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-opacity",
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

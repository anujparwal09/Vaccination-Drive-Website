import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export const Button = React.forwardRef(({
  className,
  variant = "primary",
  size = "md",
  animate = true,
  children,
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover shadow-sm focus-visible:ring-primary",
    secondary: "bg-secondary text-white hover:bg-secondary-hover shadow-sm focus-visible:ring-secondary",
    accent: "bg-accent text-white hover:bg-accent-hover shadow-sm focus-visible:ring-accent",
    outline: "border border-border bg-transparent hover:bg-muted text-foreground focus-visible:ring-ring",
    ghost: "bg-transparent hover:bg-muted text-foreground focus-visible:ring-ring",
    link: "bg-transparent text-primary underline-offset-4 hover:underline p-0",
    success: "bg-success text-white hover:opacity-90 focus-visible:ring-success",
    danger: "bg-error text-white hover:opacity-90 focus-visible:ring-error",
  }

  const sizes = {
    sm: "h-9 px-3 text-sm rounded-lg",
    md: "h-11 px-5 text-base rounded-xl",
    lg: "h-13 px-8 text-lg rounded-2xl",
    icon: "h-10 w-10 rounded-xl",
  }

  const classes = cn(baseStyles, variants[variant], sizes[size], className)

  if (animate && variant !== "link") {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        className={classes}
        {...props}
      >
        {children}
      </motion.button>
    )
  }

  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  )
})

Button.displayName = "Button"

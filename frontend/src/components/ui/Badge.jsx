import { cn } from "@/lib/utils"

export const Badge = ({ className, variant = "default", ...props }) => {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  
  const variants = {
    default: "bg-primary/10 text-primary border border-primary/20",
    secondary: "bg-secondary/10 text-secondary border border-secondary/20",
    success: "bg-success/10 text-success border border-success/20",
    warning: "bg-warning/10 text-warning border border-warning/20",
    error: "bg-error/10 text-error border border-error/20",
    outline: "border border-border text-foreground bg-transparent",
    accent: "bg-accent/10 text-accent border border-accent/20",
  }

  return <div className={cn(baseStyles, variants[variant], className)} {...props} />
}

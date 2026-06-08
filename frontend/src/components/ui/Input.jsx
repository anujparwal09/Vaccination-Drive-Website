import React, { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

export const Input = React.forwardRef(({ className, type = "text", error, label, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  
  const isPassword = type === "password"
  const inputType = isPassword ? (showPassword ? "text" : "password") : type

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={inputType}
          ref={ref}
          onClick={(e) => {
            if (type === "date") {
              e.currentTarget.showPicker?.()
            }
          }}
          className={cn(
            "flex h-11 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
            isPassword && "pr-10",
            error && "border-error focus-visible:ring-error",
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-error font-medium animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  )
})
Input.displayName = "Input"

export const Select = React.forwardRef(({ className, children, error, label, ...props }, ref) => {
  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer",
          error && "border-error focus-visible:ring-error",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-xs text-error font-medium">
          {error}
        </p>
      )}
    </div>
  )
})
Select.displayName = "Select"

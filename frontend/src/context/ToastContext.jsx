import { createContext, useContext, useState, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react"

const ToastContext = createContext(null)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within ToastProvider")
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = "success", duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-success" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning" />,
    error: <XCircle className="h-5 w-5 text-error" />,
    info: <Info className="h-5 w-5 text-primary" />,
  }

  const borders = {
    success: "border-success/20 bg-success/5 dark:bg-success/10",
    warning: "border-warning/20 bg-warning/5 dark:bg-warning/10",
    error: "border-error/20 bg-error/5 dark:bg-error/10",
    info: "border-primary/20 bg-primary/5 dark:bg-primary/10",
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              layout
              className={`pointer-events-auto flex items-start gap-3 w-full rounded-xl border glass p-4 shadow-lg ${borders[toast.type]}`}
            >
              <div className="mt-0.5">{icons[toast.type]}</div>
              <div className="flex-1 text-sm font-medium text-foreground pr-2">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-lg hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ShieldCheck, AlertCircle, ArrowLeft } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"

export const AdminLogin = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showToast } = useToast()
  
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) {
      setError("Please enter the admin password.")
      return
    }
    setError("")
    setLoading(true)
    try {
      // Hardcoded admin email
      const user = await login("admin@vaccinationdrive.org", password)
      showToast(`Welcome back, ${user.fullName}!`, "success")
      if (user.role === "admin") {
        navigate("/admin")
      } else {
        navigate("/dashboard")
      }
    } catch (err) {
      setError(err.message || "Invalid credentials.")
      showToast("Authentication failed.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-12 w-full overflow-hidden">
      
      {/* Visual illustration Column (Left on Large screens) */}
      <div className="hidden lg:flex lg:col-span-6 bg-gradient-to-tr from-[#0F3B2C] via-[#114B3A] to-[#186A52] text-white p-12 flex-col justify-between relative text-left">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
        
        {/* Top Header info */}
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg">System Administration</span>
        </div>

        {/* Core Value Prop */}
        <div className="space-y-6 max-w-md my-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-snug"
          >
            Secured Admin Console.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-slate-300 text-sm sm:text-base leading-relaxed"
          >
            Manage users, monitor vaccination records, approve incoming receipts, and ensure secure operations.
          </motion.p>
        </div>

        {/* Footer citation */}
        <div className="text-xs text-slate-400">
          © Vaccination Drive Campaign Management. Restricted Access.
        </div>
      </div>

      {/* Form Column (Right) */}
      <div className="col-span-1 lg:col-span-6 flex items-center justify-center p-6 sm:p-12 bg-slate-50 dark:bg-slate-950/20">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card glass className="border border-border/80 shadow-premium">
            <CardHeader className="space-y-1.5 pb-6">
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Admin Authentication
              </CardTitle>
              <CardDescription>
                Enter the master password to access the console.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3.5 rounded-xl border border-error/20 bg-error/5 text-error flex items-start gap-2.5 text-xs text-left font-medium animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Master Password
                    </label>
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-4 bg-primary hover:bg-primary-hover shadow-lg"
                >
                  {loading ? "Authenticating..." : "Access Console"}
                </Button>
              </form>
              
              <div className="mt-6 flex justify-center">
                 <Link to="/login" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                   <ArrowLeft className="h-3 w-3" /> Return to User Login
                 </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

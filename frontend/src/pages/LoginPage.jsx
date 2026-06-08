import { useState, useEffect, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ShieldCheck, AlertCircle, ArrowRight } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login, loginWithGoogle, handleGoogleCallback } = useAuth()
  const { showToast } = useToast()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const hasProcessedCode = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    if (code && !hasProcessedCode.current) {
      hasProcessedCode.current = true
      setLoading(true)
      handleGoogleCallback(code)
        .then((user) => {
          showToast(`Welcome back, ${user.fullName}! Authenticated via Google.`, "success")
          // Clear query params
          navigate(window.location.pathname, { replace: true })
          if (user.role === "admin") {
            navigate("/admin")
          } else {
            navigate("/dashboard")
          }
        })
        .catch((err) => {
          showToast(err.response?.data?.error || "Google authentication failed. Please try again.", "error")
        })
        .finally(() => {
          setLoading(false)
        })
    }

    const verified = params.get("verified")
    if (verified === "success") {
      showToast("Email address verified successfully. You can now login.", "success")
    } else if (verified === "failed") {
      showToast("Verification failed. Link is invalid or has expired.", "error")
    }
    
    const googleStatus = params.get("google")
    if (googleStatus === "failed") {
      showToast("Google OAuth login request failed.", "error")
    }
  }, [handleGoogleCallback, navigate, showToast])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Please fill in all fields.")
      return
    }
    setError("")
    setLoading(true)
    try {
      const user = await login(email, password)
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

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError("")
    try {
      const user = await loginWithGoogle()
      showToast(`Authenticated as ${user.fullName}`, "success")
      navigate("/dashboard")
    } catch {
      setError("Google Login failed. Please try again.")
      showToast("Google Authentication failed.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-12 w-full overflow-hidden">
      
      {/* Visual illustration Column (Left on Large screens) */}
      <div className="hidden lg:flex lg:col-span-6 bg-gradient-to-tr from-blue-950 via-slate-900 to-primary text-white p-12 flex-col justify-between relative text-left">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/15 to-transparent pointer-events-none" />
        
        {/* Top Header info */}
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg">Vaccination Drive Shield</span>
        </div>

        {/* Core Value Prop */}
        <div className="space-y-6 max-w-md my-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-snug"
          >
            Digital Vaccine Operations Made Simple.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-slate-400 text-sm sm:text-base leading-relaxed"
          >
            Access booking timelines, download verification passes, manage clinic configurations, and review invoice details in a secure dashboard.
          </motion.p>
        </div>

        {/* Footer citation */}
        <div className="text-xs text-slate-500">
          © Vaccination Drive Campaign Management. HIPAA & SOC2 Compliant.
        </div>
      </div>

      {/* Form Column (Right) */}
      <div className="col-span-1 lg:col-span-6 flex flex-col items-center justify-center p-6 sm:p-12 bg-slate-50 dark:bg-slate-950/20 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card glass className="border border-border/80 shadow-premium">
            <CardHeader className="space-y-5 pb-6">
              {/* Tab Switcher */}
              <div className="flex bg-muted/50 p-1 rounded-xl w-full border border-border/40">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/register")}
                  className="flex-1 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground h-9"
                >
                  Sign up
                </Button>
                <div className="flex-1 bg-background rounded-lg shadow-sm border border-border/60 flex items-center justify-center text-sm font-semibold text-foreground h-9">
                  Log in
                </div>
              </div>

              <div>
                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Access Gateway
                </CardTitle>
                <CardDescription className="mt-1">
                  Authenticate to access the vaccination platform.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3.5 rounded-xl border border-error/20 bg-error/5 text-error flex items-start gap-2.5 text-xs text-left font-medium animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-primary font-medium hover:underline hover:text-primary-hover"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 font-medium text-muted-foreground select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    Remember my device
                  </label>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 font-semibold rounded-xl gap-2 mt-4"
                >
                  {loading ? "Signing in..." : "Continue"} <ArrowRight className="h-4.5 w-4.5" />
                </Button>
              </form>

              {/* Separator */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground font-semibold">Or authentication via</span>
                </div>
              </div>

              {/* Google OAuth Button */}
              <Button
                variant="outline"
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-11 border border-border font-medium hover:bg-muted/40 rounded-xl gap-2.5"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.1h3.99c2.34-2.16 3.69-5.35 3.69-8.72z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.99-3.1c-1.1.74-2.51 1.18-3.97 1.18-3.05 0-5.63-2.06-6.55-4.83H1.377v3.2A11.99 11.99 0 0 0 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.45 14.34a7.16 7.16 0 0 1 0-4.68V6.46H1.377a11.99 11.99 0 0 0 0 11.08l4.073-3.2z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A11.99 11.99 0 0 0 1.377 6.46L5.45 9.66c.92-2.77 3.5-4.83 6.55-4.83z"
                  />
                </svg>
                Continue with Google
              </Button>

              {/* Register link removed since we have tabs now */}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

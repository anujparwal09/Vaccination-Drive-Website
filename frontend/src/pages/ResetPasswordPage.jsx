import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { useToast } from "@/context/ToastContext"
import { useAuth } from "@/context/AuthContext"

export const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { resetPassword } = useAuth()
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState("")
  const [token, setToken] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get("token")
    if (t) {
      setToken(t)
    } else {
      setError("Reset token is missing in link URL.")
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password || !confirmPassword) {
      setError("Please fill in all fields.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (!token) {
      setError("Missing reset token.")
      return
    }

    setError("")
    setLoading(true)
    try {
      await resetPassword(token, password)
      setCompleted(true)
      showToast("Password updated successfully.", "success")
    } catch (err) {
      setError(err.response?.data?.error || "Password reset failed.")
      showToast("Verification failed.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950/20">
      <div className="w-full max-w-md">
        
        <Card glass className="border border-border/80 shadow-premium">
          <CardHeader className="text-left pb-4">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Configure New Password
            </CardTitle>
            <CardDescription>
              Choose a strong, unique password to secure your personal health records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!completed ? (
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                {error && (
                  <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium">
                    {error}
                  </div>
                )}
                
                <Input
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
                
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 font-semibold rounded-xl gap-2 mt-2"
                >
                  {loading ? "Updating..." : "Save Password"} <ArrowRight className="h-4.5 w-4.5" />
                </Button>
              </form>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="flex justify-center">
                  <div className="h-12 w-12 rounded-full bg-success/10 text-success flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 dark:text-white">Reset Complete</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Your password has been successfully configured. You can now login.
                  </p>
                </div>
                
                <Button
                  variant="primary"
                  onClick={() => navigate("/login")}
                  className="w-full"
                >
                  Sign In Now
                </Button>
              </div>
            )}

            {!completed && (
              <div className="pt-4 border-t border-border/30 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" /> Cancel reset
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

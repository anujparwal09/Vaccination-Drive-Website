import { useState } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, ArrowLeft, Send } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { useToast } from "@/context/ToastContext"
import { useAuth } from "@/context/AuthContext"

export const ForgotPasswordPage = () => {
  const { showToast } = useToast()
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await forgotPassword(email)
      setSubmitted(true)
      showToast("Password reset link sent to your email.", "info")
    } catch (err) {
      showToast(err.response?.data?.error || "Reset request failed.", "error")
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
              Reset Password
            </CardTitle>
            <CardDescription>
              We'll send you an email instructions link to securely configure a new credential.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <Input
                  label="Registered Email Address"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 font-semibold rounded-xl gap-2 mt-2"
                >
                  {loading ? "Sending..." : "Send Reset Link"} <Send className="h-4.5 w-4.5" />
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
                  <h3 className="font-bold text-slate-900 dark:text-white">Check Your Inbox</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    An email has been sent to <span className="font-semibold">{email}</span>. Click the link to complete the reset.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-border/30 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

import { useEffect, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { CheckCircle2, Download, LayoutDashboard, ReceiptText, ShieldCheck } from "lucide-react"
import { buildApiUrl } from "@/lib/api"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"

const PAYMENT_SUCCESS_STORAGE_KEY = "vax_last_payment_success"

const formatAmount = (amount) => {
  const numericAmount = Number(amount)
  if (!Number.isFinite(numericAmount)) return "Rs. 0"
  return `Rs. ${numericAmount.toLocaleString("en-IN")}`
}

const formatDate = (value) => {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return new Date().toLocaleString("en-IN")
  return date.toLocaleString("en-IN")
}

export const PaymentSuccess = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const paymentData = useMemo(() => {
    if (location.state) return location.state

    try {
      return JSON.parse(sessionStorage.getItem(PAYMENT_SUCCESS_STORAGE_KEY) || "null")
    } catch {
      return null
    }
  }, [location.state])

  useEffect(() => {
    if (location.state) {
      sessionStorage.setItem(PAYMENT_SUCCESS_STORAGE_KEY, JSON.stringify(location.state))
    }
  }, [location.state])

  if (!paymentData?.success && !paymentData?.paymentId) {
    return (
      <div className="container max-w-md mx-auto px-4 py-20 text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <ReceiptText className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payment details unavailable</h1>
          <p className="text-sm text-muted-foreground">
            We could not find a verified payment result for this screen.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate("/dashboard")}>
          Go To Dashboard
        </Button>
      </div>
    )
  }

  const token = localStorage.getItem("vax_access_token")
  const receiptPath = paymentData.receiptUrl || `/receipt/${paymentData.registrationId}`
  const receiptHref = token
    ? buildApiUrl(`${receiptPath}?token=${encodeURIComponent(token)}`)
    : buildApiUrl(receiptPath)
  const canDownloadReceipt = Boolean(paymentData.receiptUrl) && paymentData.paymentStatus === "Confirmed"

  const details = [
    { label: "Registration Number", value: paymentData.registrationId || "N/A" },
    { label: "Payment ID", value: paymentData.paymentId || "N/A" },
    { label: "Amount", value: formatAmount(paymentData.amount) },
    { label: "Payment Date", value: formatDate(paymentData.date) },
    { label: "Receipt Status", value: canDownloadReceipt ? "Ready" : "Pending Admin Approval" },
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950/30 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Card className="border border-border/80 bg-white shadow-premium dark:bg-slate-950">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-4 text-left">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 text-success">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Congratulations, your payment is successful
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                    Your unique registration number has been generated. The admin team will approve the payment, then your PDF receipt will appear in your account.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-warning/20 bg-warning/10 px-4 py-2 text-sm font-semibold text-warning">
                Awaiting Admin Approval
              </div>
            </div>

            <div className="my-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {details.map((item) => (
                <div key={item.label} className="rounded-xl border border-border/80 bg-slate-50 px-4 py-3 text-left dark:bg-slate-900/60">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </div>
                  <div className="mt-1 break-words text-sm font-bold text-slate-900 dark:text-white">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-border/70 pt-6 sm:flex-row">
              {canDownloadReceipt ? (
                <a
                  href={receiptHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover"
                >
                  <Download className="h-4.5 w-4.5" />
                  Download Receipt
                </a>
              ) : (
                <div className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-5 text-sm font-semibold text-warning">
                  <ShieldCheck className="h-4.5 w-4.5" />
                  Receipt after admin approval
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="flex-1 gap-2"
              >
                <LayoutDashboard className="h-4.5 w-4.5" />
                Go To Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

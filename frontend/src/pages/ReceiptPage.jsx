import { useParams, useNavigate } from "react-router-dom"
import { Shield, Printer, ArrowLeft, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { buildApiUrl } from "@/lib/api"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"

export const ReceiptPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { registrations } = useAuth()

  const booking = registrations.find((r) => r.id === id)
  const token = localStorage.getItem("vax_access_token")
  const canDownloadReceipt = booking?.paymentStatus === "Confirmed" && Boolean(booking?.receiptUrl)
  const receiptHref = booking
    ? buildApiUrl(`${booking.receiptUrl || `/receipt/${booking.id}`}${token ? `?token=${encodeURIComponent(token)}` : ""}`)
    : ""

  if (!booking) {
    return (
      <div className="container max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Receipt Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested registration ID does not exist in our campaign logs.</p>
        <Button variant="primary" onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
      </div>
    )
  }

  if (!canDownloadReceipt) {
    return (
      <div className="container max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Receipt Pending Admin Approval</h2>
        <p className="text-sm text-muted-foreground">
          Your payment was received, but the PDF receipt will be available only after admin approval.
        </p>
        <Button variant="primary" onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/20 py-12 px-4 sm:px-6">
      
      {/* Action panel (Hidden on printing) */}
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 no-print w-full">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="gap-1.5 border-border/80 w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => window.open(receiptHref, "_blank", "noopener,noreferrer")}
          className="gap-1.5 bg-secondary hover:bg-secondary-hover w-full sm:w-auto"
        >
          <Printer className="h-4 w-4" /> Download PDF Receipt
        </Button>
      </div>

      {/* Printable invoice card */}
      <Card className="max-w-3xl mx-auto bg-white text-slate-800 border shadow-premium p-8 sm:p-12 relative overflow-hidden text-left bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50/40 via-white to-transparent">
        
        {/* Top Watermark seal */}
        <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success border border-success/20 text-xs font-semibold uppercase tracking-wider scale-90 sm:scale-100">
          <CheckCircle2 className="h-3.5 w-3.5" /> Payment Confirmed
        </div>

        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b pb-8 mb-8">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-secondary text-white">
                <Shield className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Vaccination Drive Shield
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-normal max-w-xs">
              Immunization HQ, Plot 22, Medical Complex Sector, Pune, India. 
              Contact: vaccination@rotaract-omc.org
            </p>
          </div>
          <div className="text-right space-y-1">
            <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400 text-sm">Receipt</h2>
            <div className="text-sm font-semibold text-slate-900">No: {booking.id}</div>
            <div className="text-xs text-slate-500">Date: {new Date(booking.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Recipient details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-sm">
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-400 uppercase text-xs tracking-wider">Billed To</h4>
            <div className="font-bold text-slate-900 text-base">{booking.fullName}</div>
            <div className="text-slate-600">Phone: {booking.phone}</div>
            <div className="text-slate-600">Email: {booking.email || "N/A"}</div>
          </div>
          <div className="space-y-1.5 text-left sm:text-right">
            <h4 className="font-bold text-slate-400 uppercase text-xs tracking-wider">Drive Details</h4>
            <div className="font-semibold text-slate-900">{booking.batchName}</div>
            <div className="text-slate-600">Appointment Date: {booking.appointmentDate}</div>
            <div className="text-slate-600">Slot: {booking.appointmentSlot}</div>
          </div>
        </div>

        {/* Invoice items table */}
        <div className="border rounded-2xl overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-bold text-xs uppercase tracking-wider text-slate-500">Description</th>
                <th className="px-6 py-3 text-center font-bold text-xs uppercase tracking-wider text-slate-500">Dose</th>
                <th className="px-6 py-3 text-right font-bold text-xs uppercase tracking-wider text-slate-500">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">{booking.vaccineName}</div>
                  <div className="text-xs text-slate-400">Vaccine immunization dose block</div>
                </td>
                <td className="px-6 py-4 text-center font-medium text-slate-700">{booking.dose}</td>
                <td className="px-6 py-4 text-right font-semibold text-slate-900">₹{booking.paymentAmount.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pricing Summary Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between gap-8 items-end sm:items-start mb-8 text-sm">
          {/* Security QR Pass */}
          <div className="flex items-center gap-4 border p-4 rounded-2xl max-w-xs">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent("RECEIPT_ID:" + booking.id)}`}
              alt="Verification QR"
              className="h-16 w-16"
            />
            <div className="space-y-0.5 text-xs text-slate-500">
              <span className="font-bold text-slate-700 block">Cryptographic pass</span>
              Scan code at the camp entrance for rapid check-in and confirmation.
            </div>
          </div>

          {/* Pricing Math */}
          <div className="w-full sm:w-64 space-y-2 text-right">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Subtotal</span>
              <span>₹{booking.paymentAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Admin Campaign Fee</span>
              <span className="text-success font-medium">Free</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-slate-900 text-base">
              <span>Total Paid</span>
              <span>₹{booking.paymentAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Footer digital seal & signature */}
        <div className="border-t pt-8 mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="text-xs text-slate-400 max-w-md">
            This invoice is generated electronically under the authority of Vaccination Drive Campaign. 
            Payment is verified using Razorpay reference transaction {booking.paymentReference}.
          </div>
          
          {/* Mock Signature Stamp */}
          <div className="text-right">
            <div className="font-cursive text-primary font-semibold text-sm -rotate-2 select-none border-2 border-primary/20 p-2 rounded-xl bg-primary/5 inline-block mb-1">
              Authorized Seal
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Medical Officer Authority</div>
          </div>
        </div>

      </Card>
    </div>
  )
}

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, Calendar, FileText, QrCode, Sparkles, Clock, CheckCircle2, ArrowRight, X, Download } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { buildApiUrl } from "@/lib/api"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"

export const UserDashboard = () => {
  const navigate = useNavigate()
  const { currentUser, registrations, fetchRegistrations } = useAuth()

  const [activeTab, setActiveTab] = useState("bookings")
  const [selectedPass, setSelectedPass] = useState(null) // State for QR modal

  // Filter registrations for this specific user
  const userBookings = currentUser ? registrations.filter((r) => r.userId === currentUser.id) : []
  const hasPendingApproval = userBookings.some((r) => r.paymentStatus !== "Confirmed")
  const paymentVerificationLabel = userBookings.length === 0
    ? "Pending"
    : hasPendingApproval
      ? "Pending"
      : "Confirmed"
  const paymentVerificationTone = paymentVerificationLabel === "Confirmed" ? "success" : "error"
  
  // Get upcoming appointment
  const nextAppointment = userBookings.find((r) => r.paymentStatus === "Confirmed" && r.verificationStatus === "Pending") || userBookings[0]

  const getReceiptHref = (booking) => {
    const token = localStorage.getItem("vax_access_token")
    const receiptPath = booking.receiptUrl || `/receipt/${booking.id}`
    return token
      ? buildApiUrl(`${receiptPath}?token=${encodeURIComponent(token)}`)
      : buildApiUrl(receiptPath)
  }

  useEffect(() => {
    if (!currentUser) return

    fetchRegistrations()

    const handleFocus = () => {
      fetchRegistrations()
    }

    window.addEventListener("focus", handleFocus)
    const intervalId = window.setInterval(fetchRegistrations, 15000)

    return () => {
      window.removeEventListener("focus", handleFocus)
      window.clearInterval(intervalId)
    }
  }, [currentUser, fetchRegistrations])

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
    } else if (currentUser.role === "admin" || currentUser.role === "staff") {
      navigate("/admin", { replace: true })
    }
  }, [currentUser, navigate])

  if (!currentUser || currentUser.role === "admin" || currentUser.role === "staff") {
    return null
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 min-h-[calc(100vh-4rem)] text-left">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            Welcome back, {currentUser.fullName} <Sparkles className="h-6 w-6 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor your vaccination drives, download A4 receipts, and print verification passes.
          </p>
        </div>
        {currentUser.role !== "admin" && (
          <Button variant="primary" onClick={() => navigate("/book")} className="gap-1">
            Book Next Dose <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Registration Status */}
        <Card className="border border-border/80 shadow-premium">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Campaign Booking</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {userBookings.length > 0 ? `${userBookings.length} Registered` : "No bookings"}
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Payment Overview */}
        <Card className="border border-border/80 shadow-premium">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${paymentVerificationTone === "success" ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Payment Verification</p>
              <h3 className={`text-xl font-bold mt-0.5 ${paymentVerificationTone === "success" ? "text-success" : "text-error"}`}>
                {paymentVerificationLabel}
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Upcoming Slot */}
        <Card className="border border-border/80 shadow-premium">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-accent/10 text-accent">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Next Appointment</p>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {nextAppointment ? (
                  `${nextAppointment.appointmentDate} (${nextAppointment.dose})`
                ) : (
                  "Not Scheduled"
                )}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Layout (Tabs & Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Section (Tab Panels) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tab buttons bar */}
          <div className="flex gap-2 border-b border-border/60 pb-3">
            {[
              { id: "bookings", label: "Vaccination Passes", icon: <QrCode className="h-4 w-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-glow"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "bookings" && (
              <motion.div
                key="bookings-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {userBookings.length === 0 ? (
                  <Card className="p-12 text-center border-dashed border-2">
                    <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">No Vaccination Registrations</h3>
                    <p className="text-xs text-muted-foreground mt-1 mb-5">
                      You haven't scheduled any vaccine doses on our platform yet.
                    </p>
                    <Button variant="primary" onClick={() => navigate("/book")}>
                      Book First Appointment
                    </Button>
                  </Card>
                ) : (
                  userBookings.map((booking) => {
                    const canDownloadReceipt = booking.paymentStatus === "Confirmed" && Boolean(booking.receiptUrl)

                    return (
                    <Card key={booking.id} glass className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-border/80 hover:shadow-md transition-all">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-slate-900 dark:text-white">{booking.vaccineName}</h4>
                          <Badge variant="outline">{booking.dose}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">ID: {booking.id}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500 pt-1">
                          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {booking.appointmentDate}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {booking.appointmentSlot}</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Badge variant={booking.paymentStatus === "Confirmed" ? "success" : "error"}>
                            Payment: {booking.paymentStatus}
                          </Badge>
                          <Badge variant={booking.verificationStatus === "Verified" ? "success" : "outline"}>
                            Status: {booking.verificationStatus}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-border/50">
                        {booking.paymentStatus === "Confirmed" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setSelectedPass(booking)}
                            className="flex-1 gap-1.5 rounded-lg text-xs"
                          >
                            <QrCode className="h-4 w-4" /> View Pass
                          </Button>
                        )}
                        {canDownloadReceipt ? (
                          <a
                            href={getReceiptHref(booking)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border/80 px-3 text-xs font-medium transition-all hover:bg-muted"
                          >
                            <FileText className="h-4 w-4" /> Download Receipt
                          </a>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="flex-1 gap-1.5 rounded-lg text-xs border-border/80"
                          >
                            <FileText className="h-4 w-4" /> Receipt Pending
                          </Button>
                        )}
                      </div>
                    </Card>
                    )
                  })
                )}
              </motion.div>
            )}

            {/* Profile Settings content has been moved to /profile-settings page */}
          </AnimatePresence>
        </div>

        {/* Right Section: Timeline & Help */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Help Box */}
          <Card className="border border-border/80 bg-slate-900 text-slate-200 p-5 space-y-4 text-left">
            <h4 className="font-bold text-sm text-white">Need Campaign Support?</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Having issues with payment verification screenshots? Contact our support officer immediately.
            </p>
            <div className="text-xs text-slate-400">
              <div>Email: vaccination@rotaract-omc.org</div>
              <div className="mt-1">Helpline: +91 93253 39930</div>
            </div>
          </Card>
        </div>

      </div>

      {/* APPLE WALLET STYLE QR PASS MODAL */}
      <AnimatePresence>
        {selectedPass && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Dark overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPass(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            {/* Wallet Pass modal */}
            <motion.div
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              className="relative w-full max-w-sm rounded-3xl overflow-hidden bg-slate-950 text-white shadow-2xl border border-slate-800 flex flex-col justify-between"
            >
              {/* Top Bar Logo */}
              <div className="p-5 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-sm text-slate-200">Vaccination Drive Shield</span>
                </div>
                <button
                  onClick={() => setSelectedPass(null)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Pass Content Area */}
              <div className="p-6 space-y-6 flex-1 text-center">
                {/* Photo & Name */}
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full border-2 border-primary/40 bg-slate-800 p-0.5 overflow-hidden">
                    <img src={currentUser.avatar} alt="User Pass" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{selectedPass.fullName}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Recipient</p>
                  </div>
                </div>

                {/* Info row */}
                <div className="grid grid-cols-2 gap-4 text-left p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] tracking-wider font-semibold block">Vaccine Name</span>
                    <span className="font-bold text-slate-200">{selectedPass.vaccineName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] tracking-wider font-semibold block">Dose Selected</span>
                    <span className="font-bold text-slate-200">{selectedPass.dose}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] tracking-wider font-semibold block">Booking ID</span>
                    <span className="font-bold text-slate-200 font-mono truncate block max-w-[120px]">{selectedPass.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] tracking-wider font-semibold block">Booking Date</span>
                    <span className="font-bold text-slate-200">{selectedPass.appointmentDate}</span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-white p-3 rounded-2xl inline-block shadow-lg mx-auto">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent("VERIFY_PASS:" + selectedPass.id)}`}
                    alt="Cryptographic QR"
                    className="h-32 w-32 object-cover bg-white"
                  />
                </div>

                {/* Badge verification */}
                <div className="flex justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/20 text-success border border-success/30 text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Payment Verified
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="flex-1 text-slate-300 hover:text-white border-slate-800 hover:bg-slate-800 text-xs rounded-xl"
                >
                  <Download className="h-4 w-4 mr-1.5" /> Download Pass
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

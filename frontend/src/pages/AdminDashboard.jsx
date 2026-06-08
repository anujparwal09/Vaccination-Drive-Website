import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, Users, DollarSign, CheckCircle2, Search, FileSpreadsheet, ShieldAlert, RefreshCw, Trash2, AlertTriangle, Settings, Save, Clock } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import api from "@/lib/api"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"

export const AdminDashboard = () => {
  const {
    users,
    registrations,
    logs,
    confirmPayment,
    rejectPayment,
    suspendUser,
    deleteUser
  } = useAuth()

  const { showToast } = useToast()

  // Tab controls
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false)
  const [isDownloadingUsersExcel, setIsDownloadingUsersExcel] = useState(false)

  // Search & Filter State (Users)
  const [userSearch, setUserSearch] = useState("")

  // Search & Filter State (Bookings)
  const [bookingSearch, setBookingSearch] = useState("")

  // User data lookup state
  const [lookupInput, setLookupInput] = useState("")
  const [lookupResult, setLookupResult] = useState(null)

  // Settings form State
  const [settingsForm, setSettingsForm] = useState({
    orgName: "vaccination campain drive",
    enableAuthLock: true
  })

  // Calculate Metrics
  const totalUsers = users.length
  const totalRevenue = registrations
    .filter((r) => r.paymentStatus === "Confirmed")
    .reduce((sum, r) => sum + r.paymentAmount, 0)
  const pendingPayments = registrations.filter((r) => r.paymentStatus === "Pending Admin Approval" || r.paymentStatus === "Pending Admin Confirmation").length
  const verifiedParticipants = registrations.filter((r) => r.verificationStatus === "Verified").length

  const handleApprovePayment = async (registrationId) => {
    try {
      await confirmPayment(registrationId)
      showToast("Payment approved and receipt generated.", "success")
    } catch (error) {
      showToast(error.response?.data?.error || "Failed to approve payment.", "error")
    }
  }

  const handleRejectPayment = async (registrationId) => {
    try {
      await rejectPayment(registrationId)
      showToast("Payment marked not approved.", "success")
    } catch (error) {
      showToast(error.response?.data?.error || "Failed to mark payment not approved.", "error")
    }
  }

  const getTransactionStatus = (registration) => {
    if (registration.paymentStatus === "Confirmed") return "Transaction Confirmed"
    if (registration.paymentStatus === "Pending Admin Approval" || registration.paymentStatus === "Pending Admin Confirmation") return "Payment Captured"
    if (registration.paymentStatus === "Not Approved") return "Transaction Not Approved"
    return "Payment Not Done"
  }

  const getTransactionVariant = (registration) => {
    if (registration.paymentStatus === "Confirmed") return "success"
    if (registration.paymentStatus === "Pending Admin Approval" || registration.paymentStatus === "Pending Admin Confirmation") return "warning"
    if (registration.paymentStatus === "Not Approved") return "error"
    return "outline"
  }

  const getUserHistory = (registration) => {
    if (!registration || registration.error) return []
    return registrations.filter((item) =>
      item.userId === registration.userId ||
      (item.email && registration.email && item.email === registration.email) ||
      (item.phone && registration.phone && item.phone === registration.phone)
    )
  }

  const getExcelErrorMessage = async (error, fallbackMessage) => {
    let message = error.response?.data?.error || fallbackMessage
    if (error.response?.data instanceof Blob) {
      const errorText = await error.response.data.text()
      if (errorText) {
        try {
          message = JSON.parse(errorText).error || message
        } catch {
          message = errorText
        }
      }
    }
    return message
  }

  const downloadExcelReport = async ({ endpoint, filename, setLoading, successMessage, errorMessage }) => {
    setLoading(true)
    try {
      const response = await api.post(endpoint, {}, { responseType: "blob" })
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      showToast(successMessage, "success")
    } catch (error) {
      const message = await getExcelErrorMessage(error, errorMessage)
      showToast(message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadExcel = () => downloadExcelReport({
    endpoint: "/admin/excel",
    filename: "vaccination_registrations",
    setLoading: setIsDownloadingExcel,
    successMessage: "Payments queue Excel downloaded successfully.",
    errorMessage: "Failed to download payments queue Excel report."
  })

  const handleDownloadUsersExcel = () => downloadExcelReport({
    endpoint: "/admin/users/excel",
    filename: "vaccination_users",
    setLoading: setIsDownloadingUsersExcel,
    successMessage: "User Management Excel downloaded successfully.",
    errorMessage: "Failed to download User Management Excel report."
  })

  // Handle manual registration lookup
  const handleUserDataSearch = (regId = lookupInput) => {
    const query = regId.trim().toLowerCase()
    const record = registrations.find((r) => r.id.toLowerCase() === query)
    if (record) {
      setLookupResult(record)
      showToast("Registration match found.", "success")
    } else {
      setLookupResult({ error: true, message: "No registration found with this ID." })
      showToast("No record found.", "error")
    }
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-8 text-left">
      
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-2 border-b lg:border-b-0 lg:border-r border-border/60 pb-6 lg:pb-0 lg:pr-6">
        <div className="px-3 py-2 mb-4">
          <Badge variant="primary" className="mb-2">Admin Mode</Badge>
          <h2 className="font-extrabold text-lg tracking-tight">Console Manager</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Control panel for vaccine drives</p>
        </div>

        {[
          { id: "dashboard", label: "Overview Panel", icon: <ShieldCheck className="h-4.5 w-4.5" /> },
          { id: "users", label: "User Management", icon: <Users className="h-4.5 w-4.5" /> },
          { id: "registrations", label: "Payments Queue", icon: <DollarSign className="h-4.5 w-4.5" /> },
          { id: "user-data", label: "User Data", icon: <Search className="h-4.5 w-4.5" /> },
          { id: "settings", label: "Drive Settings", icon: <Settings className="h-4.5 w-4.5" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              activeTab === tab.id
                ? "bg-primary text-white shadow-glow"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Overview Dashboard</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">Live tracking status of immunization campaigns</p>
                </div>
              </div>

              {/* Metric grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-border/80 shadow-premium p-4">
                  <div className="flex justify-between items-start">
                    <Users className="h-5 w-5 text-primary" />
                    <Badge variant="outline">Users</Badge>
                  </div>
                  <h3 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">{totalUsers}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Total drive registrations</p>
                </Card>

                <Card className="border border-border/80 shadow-premium p-4">
                  <div className="flex justify-between items-start">
                    <DollarSign className="h-5 w-5 text-secondary" />
                    <Badge variant="success">Revenue</Badge>
                  </div>
                  <h3 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">₹{totalRevenue.toLocaleString("en-IN")}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Verified Razorpay collections</p>
                </Card>

                <Card className="border border-border/80 shadow-premium p-4">
                  <div className="flex justify-between items-start">
                    <RefreshCw className="h-5 w-5 text-warning" />
                    <Badge variant="warning">Queue</Badge>
                  </div>
                  <h3 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">{pendingPayments}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Payments awaiting confirmation</p>
                </Card>

                <Card className="border border-border/80 shadow-premium p-4">
                  <div className="flex justify-between items-start">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <Badge variant="success">Checked-In</Badge>
                  </div>
                  <h3 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">{verifiedParticipants}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Verified clinic scans</p>
                </Card>
              </div>

              {/* Responsive SVG Charts section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* SVG Area Chart: Registration Trend */}
                <Card className="border border-border/80 lg:col-span-8 p-5">
                  <div className="mb-4">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Weekly Registration Trends</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Simulated cohorts over current week</p>
                  </div>
                  <div className="h-48 w-full bg-slate-50 dark:bg-slate-900/40 rounded-xl border p-2 flex items-end">
                    <svg className="w-full h-full" viewBox="0 0 400 150">
                      <defs>
                        <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6"/>
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/>
                        </linearGradient>
                        <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#10B981"/>
                          <stop offset="50%" stopColor="#3B82F6"/>
                          <stop offset="100%" stopColor="#8B5CF6"/>
                        </linearGradient>
                      </defs>
                      {/* Grid lines */}
                      <line x1="0" y1="30" x2="400" y2="30" stroke="#e2e8f0" strokeDasharray="4" className="dark:stroke-slate-800" />
                      <line x1="0" y1="70" x2="400" y2="70" stroke="#e2e8f0" strokeDasharray="4" className="dark:stroke-slate-800" />
                      <line x1="0" y1="110" x2="400" y2="110" stroke="#e2e8f0" strokeDasharray="4" className="dark:stroke-slate-800" />
                      {/* Area Path */}
                      <path d="M 0 120 C 40 100, 80 130, 120 90 S 200 40, 240 60 S 320 100, 400 30 L 400 150 L 0 150 Z" fill="url(#chart-grad)" />
                      {/* Line Path */}
                      <path d="M 0 120 C 40 100, 80 130, 120 90 S 200 40, 240 60 S 320 100, 400 30" fill="none" stroke="url(#line-grad)" strokeWidth="3.5" />
                      {/* Dots */}
                      <circle cx="120" cy="90" r="4" fill="#3B82F6" stroke="#fff" strokeWidth="2" />
                      <circle cx="240" cy="60" r="4" fill="#8B5CF6" stroke="#fff" strokeWidth="2" />
                      <circle cx="400" cy="30" r="4" fill="#10B981" stroke="#fff" strokeWidth="2" />
                    </svg>
                  </div>
                </Card>

                {/* SVG Donut Chart: Vaccine distribution */}
                <Card className="border border-border/80 lg:col-span-4 p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Vaccine Distribution</h4>
                    <p className="text-[10px] text-muted-foreground">Ratio of HPV vs HBV doses booked</p>
                  </div>
                  <div className="flex justify-center my-4">
                    <svg className="h-32 w-32" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="4" className="dark:stroke-slate-800" />
                      {/* 70% primary (HPV) */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2563EB" strokeWidth="4" strokeDasharray="70 30" strokeDashoffset="25" />
                      {/* 30% secondary (HBV) */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#06B6D4" strokeWidth="4" strokeDasharray="30 70" strokeDashoffset="55" />
                    </svg>
                  </div>
                  <div className="flex justify-center gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-primary" /> ceravac-HPV</div>
                    <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-secondary" /> Revac-B+</div>
                  </div>
                </Card>
              </div>

              {/* Recent System Logs */}
              <Card className="border border-border/80 p-5">
                <CardHeader className="text-left px-0 pt-0 pb-3 border-b mb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Admin Activity Timeline</CardTitle>
                </CardHeader>
                <div className="space-y-3">
                  {logs.filter(l => l.action.includes("Admin")).length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No admin activity recorded yet.</p>
                  )}
                  {logs.filter(l => l.action.includes("Admin")).slice(0, 4).map((log) => (
                    <div key={log.id} className="text-xs flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                      <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary" /> {log.action}
                      </span>
                      <span className="text-muted-foreground">{new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
              </Card>

            </motion.div>
          )}

          {activeTab === "users" && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Registered Users</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">Control account levels and access permissions</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadUsersExcel}
                  disabled={isDownloadingUsersExcel}
                  className="gap-1.5 border-border/80"
                >
                  <FileSpreadsheet className="h-4 w-4" /> {isDownloadingUsersExcel ? "Downloading..." : "Download Excel"}
                </Button>
              </div>

              {/* Table search filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or telephone ID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10 h-11 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              {/* Users table */}
              <Card className="border border-border/80 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/40 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left font-bold text-xs uppercase tracking-wider text-slate-500">Participant</th>
                      <th className="px-6 py-3 text-left font-bold text-xs uppercase tracking-wider text-slate-500">Contact Details</th>
                      <th className="px-6 py-3 text-center font-bold text-xs uppercase tracking-wider text-slate-500">Role</th>
                      <th className="px-6 py-3 text-right font-bold text-xs uppercase tracking-wider text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {users
                      .filter((u) => {
                        const matchesSearch = u.fullName.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
                        return matchesSearch && u.role === "user"
                      })
                      .map((u) => (
                        <tr key={u.id}>
                          <td className="px-6 py-4 flex items-center gap-3">
                            <img src={u.avatar} alt="Avatar" className="h-9 w-9 rounded-full bg-slate-100" />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{u.fullName}</div>
                              <span className="text-[10px] text-muted-foreground font-semibold">ID: {u.id}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-slate-800 dark:text-slate-200">{u.email}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{u.phone}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant={u.role === "admin" ? "success" : "outline"}>
                              {u.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => suspendUser(u.id)}
                                className="h-8 w-8 text-warning border-border/80"
                              >
                                <ShieldAlert className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => deleteUser(u.id)}
                                className="h-8 w-8 text-error border-border/80"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </Card>
            </motion.div>
          )}

          {activeTab === "registrations" && (
            <motion.div
              key="registrations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Payments Queue</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">Verify uploaded receipts and transactions</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadExcel}
                  disabled={isDownloadingExcel}
                  className="gap-1.5 border-border/80"
                >
                  <FileSpreadsheet className="h-4 w-4" /> {isDownloadingExcel ? "Downloading..." : "Download Excel"}
                </Button>
              </div>

              {/* Table search filters */}
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Search by transaction reference or registration ID..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus-visible:outline-none"
                />
              </div>

              {/* Queue table */}
              <Card className="border border-border/80 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/40 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left font-bold text-xs uppercase tracking-wider text-slate-500">Registration</th>
                      <th className="px-6 py-3 text-left font-bold text-xs uppercase tracking-wider text-slate-500">Participant</th>
                      <th className="px-6 py-3 text-left font-bold text-xs uppercase tracking-wider text-slate-500">Vaccine</th>
                      <th className="px-6 py-3 text-center font-bold text-xs uppercase tracking-wider text-slate-500">Payment</th>
                      <th className="px-6 py-3 text-center font-bold text-xs uppercase tracking-wider text-slate-500">Transaction Status</th>
                      <th className="px-6 py-3 text-right font-bold text-xs uppercase tracking-wider text-slate-500">Approval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {registrations
                      .filter((r) => {
                        const query = bookingSearch.toLowerCase()
                        const searchable = [
                          r.id,
                          r.fullName,
                          r.email,
                          r.phone,
                          r.vaccineName,
                          r.paymentId,
                          r.paymentStatus,
                        ].filter(Boolean).join(" ").toLowerCase()
                        return searchable.includes(query)
                      })
                      .map((r) => (
                        <tr key={r.id}>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 dark:text-white">{r.id}</div>
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              {new Date(r.createdAt).toLocaleDateString("en-IN")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-left">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{r.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{r.phone} | Age: {r.age}</div>
                          </td>
                          <td className="px-6 py-4 text-left">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{r.vaccineName}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{r.dose} | {r.appointmentDate || "No date"}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="font-bold text-slate-900 dark:text-white">Rs. {Number(r.paymentAmount || 0).toLocaleString("en-IN")}</div>
                            <div className="mx-auto mt-1 max-w-[130px] truncate text-[10px] text-slate-400 font-medium">
                              {r.paymentId || "Payment not done"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge
                              variant={getTransactionVariant(r)}
                              className="text-[9px] py-0"
                            >
                              {getTransactionStatus(r)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {r.paymentStatus === "Pending Admin Approval" || r.paymentStatus === "Pending Admin Confirmation" ? (
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleApprovePayment(r.id)}
                                  className="h-8 rounded-lg text-xs bg-success hover:bg-success/90"
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRejectPayment(r.id)}
                                  className="h-8 rounded-lg text-xs border-border/80 text-error"
                                >
                                  Not Approve
                                </Button>
                              </div>
                            ) : r.paymentStatus === "Confirmed" ? (
                              <span className="text-xs font-semibold text-success flex items-center justify-end gap-1.5">
                                <CheckCircle2 className="h-4 w-4" /> Approved
                              </span>
                            ) : r.paymentStatus === "Not Approved" ? (
                              <span className="text-xs font-semibold text-error flex items-center justify-end gap-1.5">
                                <AlertTriangle className="h-4 w-4" /> Not Approved
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-muted-foreground flex items-center justify-end gap-1.5">
                                <Clock className="h-4 w-4" /> Awaiting Payment
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </Card>
            </motion.div>
          )}

          {activeTab === "user-data" && (
            <motion.div
              key="user-data"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="pb-2 border-b">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">User Data Lookup</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Enter a registration number to view participant details, payment history, and appointment count.</p>
              </div>

              <Card className="border border-border/80 p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Enter registration number, e.g. REG-2026-0005"
                    value={lookupInput}
                    onChange={(e) => setLookupInput(e.target.value)}
                    className="h-11"
                  />
                  <Button
                    variant="primary"
                    onClick={() => handleUserDataSearch()}
                    className="h-11 gap-2 sm:w-36"
                  >
                    <Search className="h-4 w-4" /> Search
                  </Button>
                </div>
              </Card>

              {lookupResult ? (
                lookupResult.error ? (
                  <Card className="border-error/20 bg-error/5 p-8 text-center space-y-4">
                    <AlertTriangle className="h-10 w-10 text-error mx-auto" />
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Registration Not Found</h3>
                      <p className="text-xs text-muted-foreground mt-1">{lookupResult.message}</p>
                    </div>
                  </Card>
                ) : (
                  (() => {
                    const userHistory = getUserHistory(lookupResult)
                    const paidTransactions = userHistory.filter((item) => item.paymentId).length
                    const approvedPayments = userHistory.filter((item) => item.paymentStatus === "Confirmed").length
                    const pendingApprovals = userHistory.filter((item) => item.paymentStatus === "Pending Admin Approval").length

                    return (
                      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        <Card className="xl:col-span-4 border border-border/80 p-6 space-y-5">
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold block">Participant</span>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{lookupResult.fullName}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{lookupResult.id}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="rounded-xl bg-muted/40 p-3">
                              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">Age</span>
                              <span className="font-semibold">{lookupResult.age}</span>
                            </div>
                            <div className="rounded-xl bg-muted/40 p-3">
                              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">Gender</span>
                              <span className="font-semibold">{lookupResult.gender}</span>
                            </div>
                            <div className="rounded-xl bg-muted/40 p-3 col-span-2">
                              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">Phone</span>
                              <span className="font-semibold">{lookupResult.phone || "N/A"}</span>
                            </div>
                            <div className="rounded-xl bg-muted/40 p-3 col-span-2">
                              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">Email</span>
                              <span className="font-semibold break-words">{lookupResult.email || "N/A"}</span>
                            </div>
                            <div className="rounded-xl bg-muted/40 p-3 col-span-2">
                              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">Address</span>
                              <span className="font-semibold">{lookupResult.address || "N/A"}</span>
                            </div>
                          </div>
                        </Card>

                        <div className="xl:col-span-8 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Card className="border border-border/80 p-4">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Bookings</p>
                              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{userHistory.length}</div>
                            </Card>
                            <Card className="border border-border/80 p-4">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Transactions</p>
                              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{paidTransactions}</div>
                            </Card>
                            <Card className="border border-border/80 p-4">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Approved</p>
                              <div className="text-2xl font-bold text-success mt-1">{approvedPayments}</div>
                              {pendingApprovals > 0 && <p className="text-[10px] text-warning font-semibold mt-1">{pendingApprovals} pending approval</p>}
                            </Card>
                          </div>

                          <Card className="border border-border/80 overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-50 dark:bg-slate-900/40 border-b">
                                <tr>
                                  <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-slate-500">Registration</th>
                                  <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-slate-500">Vaccine</th>
                                  <th className="px-5 py-3 text-center text-xs uppercase tracking-wider text-slate-500">Transaction</th>
                                  <th className="px-5 py-3 text-center text-xs uppercase tracking-wider text-slate-500">Approval</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/40">
                                {userHistory.map((item) => (
                                  <tr key={item.id}>
                                    <td className="px-5 py-4">
                                      <div className="font-bold text-slate-900 dark:text-white">{item.id}</div>
                                      <div className="text-[10px] text-muted-foreground">{item.appointmentDate || "No appointment date"}</div>
                                    </td>
                                    <td className="px-5 py-4">
                                      <div className="font-semibold">{item.vaccineName}</div>
                                      <div className="text-[10px] text-muted-foreground">{item.dose}</div>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                      <Badge variant={getTransactionVariant(item)}>{getTransactionStatus(item)}</Badge>
                                      <div className="text-[10px] text-muted-foreground mt-1 truncate max-w-[150px] mx-auto">{item.paymentId || "No transaction"}</div>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                      <Badge variant={item.paymentStatus === "Confirmed" ? "success" : item.paymentStatus === "Not Approved" ? "error" : "warning"}>
                                        {item.paymentStatus}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </Card>
                        </div>
                      </div>
                    )
                  })()
                )
              ) : (
                <Card className="p-10 border-dashed border-2 text-center text-muted-foreground">
                  <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-xs">Search a registration number to inspect the complete participant record.</p>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border border-border/80 shadow-premium">
                <CardHeader className="text-left border-b pb-4">
                  <CardTitle className="text-lg">Platform Settings</CardTitle>
                  <CardDescription>Configure basic platform appearance and general information.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 text-left space-y-6">
                  
                  {/* Organization Setting */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b pb-1.5">Camp Information</h4>
                    <Input
                      label="Host Organization Name"
                      value={settingsForm.orgName}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, orgName: e.target.value }))}
                    />
                  </div>

                  {/* Save Button */}
                  <Button
                    variant="primary"
                    onClick={() => showToast("Configurations updated.", "success")}
                    className="w-full gap-2 mt-4"
                  >
                    <Save className="h-4.5 w-4.5" /> Save Configuration Settings
                  </Button>

                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  )
}

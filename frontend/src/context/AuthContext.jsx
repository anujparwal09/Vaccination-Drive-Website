import { createContext, useContext, useState, useEffect, useCallback } from "react"
import api, { buildApiUrl } from "@/lib/api"

const AuthContext = createContext(null)

const getStoredCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("vax_current_user") || "null")
  } catch {
    return null
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(getStoredCurrentUser)
  const [loading, setLoading] = useState(true)
  const [vaccines, setVaccines] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])

  // Helper for system logging
  const addLog = (action) => {
    const newLog = { id: Date.now().toString(), action, time: new Date().toISOString() }
    setLogs(prev => {
      const updated = [newLog, ...prev]
      localStorage.setItem("vax_logs", JSON.stringify(updated))
      return updated
    })
  }

  useEffect(() => {
    const savedLogs = localStorage.getItem("vax_logs")
    if (savedLogs) setLogs(JSON.parse(savedLogs))
  }, [])

  // 1. Refresh session & fetch profile on app mount
  const checkSession = async () => {
    const params = new URLSearchParams(window.location.search)
    if (params.has("code")) {
      // Google OAuth is handling login, skip session check to avoid race conditions
      setLoading(false)
      return
    }

    try {
      // Refresh access token via HTTP-Only cookie
      const refreshRes = await api.post("/auth/refresh-token")
      const { accessToken } = refreshRes.data
      localStorage.setItem("vax_access_token", accessToken)

      // Fetch user profile details
      const profileRes = await api.get("/auth/me")
      const { user } = profileRes.data
      
      setCurrentUser((current) => {
        if (current) return current
        localStorage.setItem("vax_current_user", JSON.stringify(user))
        return user
      })
    } catch {
      setCurrentUser((current) => {
        if (current) return current
        localStorage.removeItem("vax_access_token")
        localStorage.removeItem("vax_current_user")
        return null
      })
    } finally {
      setLoading(false)
    }
  }

  // Load vaccines list
  const loadCampaignConfig = useCallback(async () => {
    try {
      const res = await api.get("/config")
      setVaccines(res.data.vaccines)
    } catch {
      setVaccines([])
    }
  }, [])

  useEffect(() => {
    checkSession()
    loadCampaignConfig()
  }, [loadCampaignConfig])

  // Load registrations (if logged in)
  const fetchRegistrations = useCallback(async () => {
    if (!currentUser) return
    try {
      const res = await api.get("/registrations")
      setRegistrations(res.data)
      
      if (currentUser.role === "admin") {
        const usersRes = await api.get("/admin/users")
        setUsers(usersRes.data)
      }
    } catch {
      setRegistrations([])
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser) {
      fetchRegistrations()
    } else {
      setRegistrations([])
    }
  }, [currentUser, fetchRegistrations])

  // Login handler
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password })
    const { accessToken, user } = res.data
    localStorage.setItem("vax_access_token", accessToken)
    localStorage.setItem("vax_current_user", JSON.stringify(user))
    setCurrentUser(user)
    
    if (user.role === "admin") {
      addLog(`System Admin logged in successfully`)
    }
    
    return user
  }

  // Google OAuth redirect trigger
  const loginWithGoogle = () => {
    // Redirect browser directly to backend oauth initialization url
    window.location.href = buildApiUrl("/auth/google")
  }

  // Handle Google OAuth callback exchange code for token
  const handleGoogleCallback = async (code) => {
    const res = await api.get("/auth/google/callback", { params: { code } })
    const { accessToken, user } = res.data
    localStorage.setItem("vax_access_token", accessToken)
    localStorage.setItem("vax_current_user", JSON.stringify(user))
    setCurrentUser(user)
    return user
  }

  // Register handler
  const registerUser = async (userData) => {
    const res = await api.post("/auth/register", {
      fullName: userData.fullName,
      email: userData.email,
      password: userData.password,
      phone: userData.phone,
      age: userData.age,
      gender: userData.gender,
      address: userData.address,
      avatar: userData.avatar,
    })
    const { accessToken, user } = res.data
    localStorage.setItem("vax_access_token", accessToken)
    localStorage.setItem("vax_current_user", JSON.stringify(user))
    setCurrentUser(user)
    return user
  }

  // Logout handler
  const logout = async () => {
    try {
      await api.post("/auth/logout")
    } catch {
      // Local session is cleared even if the network request fails.
    } finally {
      localStorage.removeItem("vax_access_token")
      localStorage.removeItem("vax_current_user")
      setCurrentUser(null)
    }
  }

  // Forgot password
  const forgotPassword = async (email) => {
    await api.post("/auth/forgot-password", { email })
  }

  // Reset password
  const resetPassword = async (token, password) => {
    await api.post("/auth/reset-password", { token, password })
  }

  // Update profile persistently on the server
  const updateProfile = async (profileData) => {
    const res = await api.put("/auth/profile", profileData)
    const { user } = res.data
    localStorage.setItem("vax_current_user", JSON.stringify(user))
    setCurrentUser(user)
    return user
  }

  // Book vaccine
  const addBooking = async (bookingData) => {
    const res = await api.post("/registrations", bookingData)
    // Refresh bookings queue
    fetchRegistrations()
    return res.data.registration
  }

  // Create Razorpay Order
  const createPaymentOrder = async (registrationId) => {
    const res = await api.post("/payments/create-order", { registrationId })
    return res.data
  }

  // Verify Razorpay Payment
  const verifyPayment = async (paymentData) => {
    const res = await api.post("/payment/verify-payment", paymentData)
    fetchRegistrations()
    return res.data
  }

  // Admin Confirm payment
  const confirmPayment = async (bookingId) => {
    await api.post(`/admin/confirm-payment/${bookingId}`)
    addLog(`System Admin confirmed payment for booking ID: ${bookingId}`)
    fetchRegistrations()
  }

  // Admin Refund payment
  const refundPayment = async (bookingId) => {
    await api.post(`/admin/refund-payment/${bookingId}`)
    addLog(`System Admin refunded payment for booking ID: ${bookingId}`)
    fetchRegistrations()
  }

  // Admin Reject payment
  const rejectPayment = async (bookingId) => {
    await api.post(`/admin/reject-payment/${bookingId}`)
    addLog(`System Admin rejected payment for booking ID: ${bookingId}`)
    fetchRegistrations()
  }

  // Verify participant gate scan
  const verifyParticipant = async (bookingId) => {
    await api.post(`/verify/${bookingId}`)
    fetchRegistrations()
  }

  // Mock controls for front interface support
  const suspendUser = async (userId) => {
    addLog(`System Admin reviewed suspend action for user ID: ${userId}`)
  }

  const deleteUser = async (userId) => {
    addLog(`System Admin reviewed delete action for user ID: ${userId}`)
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        vaccines,
        registrations,
        logs,
        users,
        isAdmin: currentUser?.role === "admin",
        isStaff: currentUser?.role === "staff" || currentUser?.role === "admin",
        login,
        loginWithGoogle,
        handleGoogleCallback,
        registerUser,
        logout,
        updateProfile,
        addBooking,
        confirmPayment,
        verifyParticipant,
        refundPayment,
        rejectPayment,
        suspendUser,
        deleteUser,
        forgotPassword,
        resetPassword,
        fetchRegistrations,
        checkSession,
        createPaymentOrder,
        verifyPayment
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

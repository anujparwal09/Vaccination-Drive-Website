import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./context/ThemeContext"
import { AuthProvider } from "./context/AuthContext"
import { ToastProvider } from "./context/ToastContext"
import { Navbar } from "./components/Navbar"
import './App.css'

// Page imports
import { LandingPage } from "./pages/LandingPage"
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage"
import { ResetPasswordPage } from "./pages/ResetPasswordPage"
import { UserDashboard } from "./pages/UserDashboard"
import { VaccinationRegistrationPage } from "./pages/VaccinationRegistrationPage"
import { ReceiptPage } from "./pages/ReceiptPage"
import { PaymentSuccess } from "./pages/PaymentSuccess"
import { AdminDashboard } from "./pages/AdminDashboard"
import { AdminLogin } from "./pages/AdminLogin"
import { ProfileSettingsPage } from "./pages/ProfileSettingsPage"
import { PrivateRoute } from "./components/PrivateRoute"

import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage"
import { TermsOfServicePage } from "./pages/TermsOfServicePage"

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsOfServicePage />} />

                  {/* General Protected Routes */}
                  <Route element={<PrivateRoute allowedRoles={["user", "admin", "staff"]} />}>
                    <Route path="/dashboard" element={<UserDashboard />} />
                    <Route path="/profile-settings" element={<ProfileSettingsPage />} />
                    <Route path="/receipt/:id" element={<ReceiptPage />} />
                    <Route path="/payment-success" element={<PaymentSuccess />} />
                  </Route>

                  {/* User Only Bookings */}
                  <Route element={<PrivateRoute allowedRoles={["user"]} />}>
                    <Route path="/book" element={<VaccinationRegistrationPage />} />
                  </Route>

                  {/* Admin & Staff Only consoles */}
                  <Route element={<PrivateRoute allowedRoles={["admin", "staff"]} />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                  </Route>
                </Routes>
              </main>
            </div>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App

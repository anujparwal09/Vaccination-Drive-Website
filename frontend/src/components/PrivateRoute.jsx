import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export const PrivateRoute = ({ allowedRoles }) => {
  const { currentUser, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Redirect to login if user session is not present
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  // Redirect if role is not allowed
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />
  }

  // Force normal users to complete their profile first
  if (currentUser.role === "user" && (!currentUser.age || !currentUser.phone) && location.pathname !== "/profile-settings") {
    return <Navigate to="/profile-settings" replace state={{ requireCompletion: true }} />
  }

  return <Outlet />
}

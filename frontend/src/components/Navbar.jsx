import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Bell, Sun, Moon, LogOut, Shield, User as UserIcon, Calendar, Menu, X } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"

export const Navbar = () => {
  const { currentUser, isAdmin, logout, logs } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Get recent logs for notifications (simulate notification data)
  const notifications = logs.slice(0, 5)

  const handleLogout = () => {
    logout()
    setShowProfileMenu(false)
    navigate("/")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl mx-auto items-center justify-between px-4 sm:px-6">
        
        {/* Brand Logo */}
        <Link to="/" className="flex flex-row items-center space-x-3 max-w-[70%] sm:max-w-none">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-white shadow-sm overflow-hidden border border-border/50">
            <img src="/assets/logo_round.jpg" alt="Rotaract Logo" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-[1rem] sm:text-[1.3rem] leading-tight text-slate-900 dark:text-white tracking-tight truncate sm:whitespace-normal">
              <span className="sm:hidden">Rotaract OMC</span>
              <span className="hidden sm:inline">Rotaract Club of Osmania Medical College</span>
            </span>
            <span className="text-[8px] sm:text-xs font-bold tracking-[0.15em] sm:tracking-[0.2em] text-[#114B3A] dark:text-[#38a169] uppercase mt-0.5 whitespace-nowrap">
              HBV · HPV VACCINATION DRIVE
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link to="/" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg">
            Home
          </Link>
          {!currentUser && (
            <>
              <Link to="/register" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg">
                Register
              </Link>
              <Link to="/admin-login" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg">
                Admin
              </Link>
            </>
          )}
          {currentUser && (
            <Link to="/dashboard" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg">
              Dashboard
            </Link>
          )}
          {currentUser && !isAdmin && (
            <Link to="/book" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg">
              Book Vaccination
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-primary" /> Admin Panel
            </Link>
          )}
        </nav>

        {/* Right Action Items */}
        <div className="flex items-center space-x-3">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {currentUser ? (
            <>
              {/* Notification Center */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowNotifications(!showNotifications)
                    setShowProfileMenu(false)
                  }}
                  className="relative text-muted-foreground hover:text-foreground"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error" />
                </Button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 rounded-2xl border bg-card p-4 shadow-xl glass animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
                      <h4 className="font-semibold text-sm">Notifications</h4>
                      <Badge variant="default" className="text-[10px] py-0">Recent</Badge>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div key={notif.id} className="text-xs text-left py-1 hover:bg-muted/50 rounded px-1 transition-colors">
                          <p className="font-medium text-foreground">{notif.action}</p>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Account Avatar & Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu)
                    setShowNotifications(false)
                  }}
                  className="flex items-center gap-2.5 rounded-full border border-border py-1.5 px-3 hover:shadow-sm transition-all focus:outline-none bg-muted/20"
                >
                  {currentUser?.profileImage ? (
                    <img
                      src={currentUser.profileImage}
                      alt={currentUser.fullName}
                      className="h-7 w-7 rounded-full object-cover shadow-sm bg-slate-100 shrink-0"
                    />
                  ) : (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold uppercase shadow-sm">
                      {currentUser?.fullName ? currentUser.fullName.charAt(0) : "U"}
                    </div>
                  )}
                  <span className="text-sm font-semibold max-w-[120px] truncate text-foreground hidden sm:block">
                    {currentUser?.fullName || "User"}
                  </span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-3 w-56 rounded-2xl border bg-card p-2 shadow-xl glass animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-2 border-b border-border/50 mb-1 text-left">
                      <p className="text-sm font-semibold text-foreground truncate">{currentUser.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        navigate("/profile-settings")
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
                    >
                      <UserIcon className="h-4 w-4" /> Profile Settings
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        navigate("/dashboard")
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
                    >
                      <Calendar className="h-4 w-4" /> My Dashboard
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          navigate("/admin")
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
                      >
                        <Shield className="h-4 w-4" /> Admin Console
                      </button>
                    )}

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/5 rounded-xl transition-all border-t border-border/30 mt-1"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2.5">
              <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate("/register")}>
                Sign Up
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-muted-foreground hover:text-foreground"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card p-4 space-y-3 animate-in slide-in-from-top-5 duration-200">
          <nav className="flex flex-col space-y-2 text-left">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg"
            >
              Home
            </Link>
            {currentUser && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile-settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg"
                >
                  Profile Settings
                </Link>
              </>
            )}
            {currentUser && !isAdmin && (
              <Link
                to="/book"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg"
              >
                Book Vaccination
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg text-primary flex items-center gap-1.5"
              >
                <Shield className="h-4 w-4" /> Admin Panel
              </Link>
            )}
          </nav>

          {!currentUser && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
              <Button variant="outline" size="sm" onClick={() => { setMobileMenuOpen(false); navigate("/login") }}>
                Sign In
              </Button>
              <Button variant="primary" size="sm" onClick={() => { setMobileMenuOpen(false); navigate("/register") }}>
                Register
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

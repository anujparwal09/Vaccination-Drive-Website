import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { User, ShieldCheck, ArrowLeft } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Input, Select } from "@/components/ui/Input"

export const ProfileSettingsPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, updateProfile } = useAuth()
  const { showToast } = useToast()

  const [profileData, setProfileData] = useState({
    fullName: currentUser?.fullName || "",
    phone: currentUser?.phone || "",
    age: currentUser?.age || "",
    gender: currentUser?.gender || "Male",
  })
  
  const [updating, setUpdating] = useState(false)
  const isRequired = location.state?.requireCompletion

  useEffect(() => {
    if (isRequired) {
      showToast("Please complete your profile details before continuing.", "warning")
    }
  }, [isRequired, showToast])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    if (!profileData.age || !profileData.phone) {
      showToast("Please fill in all mandatory fields.", "error")
      return
    }

    setUpdating(true)
    try {
      await updateProfile(profileData)
      showToast("Profile details saved successfully.", "success")
      
      // If they were forced here, redirect them back to dashboard
      if (isRequired || !currentUser.age) {
        navigate("/dashboard")
      }
    } catch {
      showToast("Profile update failed.", "error")
    } finally {
      setUpdating(false)
    }
  }

  if (!currentUser) return null

  return (
    <div className="container max-w-3xl mx-auto px-4 py-12 sm:px-6 min-h-[calc(100vh-4rem)] text-left">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} disabled={isRequired} className={isRequired ? "invisible" : ""}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              Participant Details <User className="h-6 w-6 text-primary" />
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isRequired ? "Welcome! Please finalize your account to start booking." : "Update your personal and contact details securely."}
            </p>
          </div>
        </div>

        <Card className="border border-border/80 shadow-premium">
          <CardHeader className="text-left border-b pb-4 bg-slate-50 dark:bg-slate-900/40">
            <CardTitle className="text-lg">Update Profile Settings</CardTitle>
            <CardDescription>Adjust your mobile number and identity details for vaccination checks.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <Input
                label="Full Name"
                value={profileData.fullName}
                onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Recipient Age"
                  type="number"
                  value={profileData.age}
                  onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                  required
                />
                <Select
                  label="Gender"
                  value={profileData.gender}
                  onChange={(e) => setProfileData(prev => ({ ...prev, gender: e.target.value }))}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                </Select>
              </div>
              <Input
                label="Phone Contact"
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                required
              />

              
              <div className="pt-4 border-t border-border/60 mt-6">
                <Button variant="primary" type="submit" disabled={updating} className="w-full sm:w-auto px-8 gap-2">
                  <ShieldCheck className="h-4.5 w-4.5" />
                  {updating ? "Saving details..." : "Save Profile Details"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

import { Fragment, useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, Sparkles, CheckCircle, CheckCircle2, ChevronRight } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Input, Select } from "@/components/ui/Input"

export const RegisterPage = () => {
  const navigate = useNavigate()
  const { registerUser, loginWithGoogle, handleGoogleCallback } = useAuth()
  const { showToast } = useToast()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  
  // Registration State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    age: "",
    gender: "Male",
    avatar: "",
  })

  const [avatarOptions, setAvatarOptions] = useState([])
  const hasProcessedCode = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    if (code && !hasProcessedCode.current) {
      hasProcessedCode.current = true
      setLoading(true)
      handleGoogleCallback(code)
        .then((user) => {
          showToast(`Welcome back, ${user.fullName}! Authenticated via Google.`, "success")
          // Clear query params
          navigate(window.location.pathname, { replace: true })
          if (user.role === "admin") {
            navigate("/admin")
          } else {
            navigate("/dashboard")
          }
        })
        .catch((err) => {
          showToast(err.response?.data?.error || "Google authentication failed. Please try again.", "error")
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [handleGoogleCallback, navigate, showToast])

  const getAvatarsForGender = (gender) => {
    const maleSeeds = ["Oliver", "Jack", "Harry", "Thomas", "George", "James", "Noah", "Leo", "Oscar", "Mason", "Ethan", "William", "Lucas", "Henry", "Alexander"];
    const femaleSeeds = ["Aria", "Zoe", "Lily", "Sophia", "Isabella", "Mia", "Emily", "Ella", "Charlotte", "Amelia", "Grace", "Chloe", "Evie", "Ruby", "Freya"];
    const neutralSeeds = ["Pepper", "Gizmo", "Harley", "Scout", "Lucky", "Shadow", "Bailey", "Charlie", "Angel", "Rusty", "Robin", "Alex", "Sam", "Jordan", "Taylor"];

    let pool = neutralSeeds;
    if (gender === "Male") {
      pool = maleSeeds;
    } else if (gender === "Female") {
      pool = femaleSeeds;
    }

    // Shuffle pool and select 6
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 6).map(seed => `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`);
  }

  useEffect(() => {
    const options = getAvatarsForGender(formData.gender)
    setAvatarOptions(options)
    // Automatically select the first option as default
    setFormData(prev => ({ ...prev, avatar: options[0] }))
  }, [formData.gender])

  const handleRegenerateRandom = () => {
    const newOptions = getAvatarsForGender(formData.gender)
    setAvatarOptions(newOptions)
    handleInputChange("avatar", newOptions[Math.floor(Math.random() * newOptions.length)])
  }

  const validateStep = (currentStep) => {
    const stepErrors = {}
    if (currentStep === 1) {
      if (!formData.email) stepErrors.email = "Email is required."
      else if (!/\S+@\S+\.\S+/.test(formData.email)) stepErrors.email = "Invalid email format."
      if (!formData.password) stepErrors.password = "Password is required."
      else if (formData.password.length < 6) stepErrors.password = "Password must be at least 6 characters."
      if (formData.password !== formData.confirmPassword) {
        stepErrors.confirmPassword = "Passwords do not match."
      }
    } else if (currentStep === 2) {
      if (!formData.fullName) stepErrors.fullName = "Full Name is required."
      if (!formData.phone) stepErrors.phone = "Phone number is required."
      else if (!/^\d{10}$/.test(formData.phone)) stepErrors.phone = "Phone must be a 10-digit number."
      if (!formData.age) stepErrors.age = "Age is required."
      else if (parseInt(formData.age) < 1 || parseInt(formData.age) > 120) {
        stepErrors.age = "Please enter a valid age."
      }
      // Address validation removed
    }
    
    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    setStep((prev) => prev - 1)
  }

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleRegister = async () => {
    setLoading(true)
    try {
      await registerUser(formData)
      showToast("Account registered successfully!", "success")
      setStep(5) // Confetti step
    } catch (err) {
      showToast(err.message || "Registration failed.", "error")
      setErrors({ apiError: err.message })
    } finally {
      setLoading(false)
    }
  }

  // Animation variants
  const slideVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-12 w-full overflow-hidden">
      
      {/* Visual illustration Column (Left on Large screens) */}
      <div className="hidden lg:flex lg:col-span-6 bg-gradient-to-tr from-blue-950 via-slate-900 to-primary text-white p-12 flex-col justify-between relative text-left">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/15 to-transparent pointer-events-none" />
        
        {/* Top Header info */}
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg">Vaccination Drive Shield</span>
        </div>

        {/* Core Value Prop */}
        <div className="space-y-6 max-w-md my-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-snug"
          >
            Digital Vaccine Operations Made Simple.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-slate-400 text-sm sm:text-base leading-relaxed"
          >
            Access booking timelines, download verification passes, manage clinic configurations, and review invoice details in a secure dashboard.
          </motion.p>
        </div>

        {/* Footer citation */}
        <div className="text-xs text-slate-500">
          © Vaccination Drive Campaign Management. HIPAA & SOC2 Compliant.
        </div>
      </div>

      {/* Form Column (Right) */}
      <div className="col-span-1 lg:col-span-6 flex flex-col items-center justify-center p-6 sm:p-12 bg-slate-50 dark:bg-slate-950/20 overflow-y-auto">
        <div className="w-full max-w-md">
        
        {/* Progress Timeline Tracker */}
        {step < 5 && (
          <div className="mb-8 flex items-center justify-between px-4 max-w-sm mx-auto">
            {[1, 2, 3, 4].map((s) => (
              <Fragment key={s}>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all border ${
                    step >= s
                      ? "bg-primary border-primary text-white shadow-glow"
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  {step > s ? <CheckCircle className="h-4.5 w-4.5" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-all ${
                      step > s ? "bg-primary" : "bg-border/60 dark:bg-border/10"
                    }`}
                  />
                )}
              </Fragment>
            ))}
          </div>
        )}

        <Card glass className="border border-border/80 shadow-premium">
          {step === 1 && (
            <CardHeader className="space-y-5 pb-0">
              {/* Tab Switcher */}
              <div className="flex bg-muted/50 p-1 rounded-xl w-full border border-border/40">
                <div className="flex-1 bg-background rounded-lg shadow-sm border border-border/60 flex items-center justify-center text-sm font-semibold text-foreground h-9">
                  Sign up
                </div>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="flex-1 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground h-9"
                >
                  Log in
                </Button>
              </div>
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Create Account
                </CardTitle>
                <CardDescription className="mt-1">
                  Join the platform to book your vaccination.
                </CardDescription>
              </div>
            </CardHeader>
          )}
          <CardContent className={step === 1 ? "pt-6" : "pt-8"}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-4 text-left"
                >
                  <div className="text-center pb-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Credentials & Auth</h2>
                    <p className="text-xs text-muted-foreground mt-1">Configure your login credentials for scheduling</p>
                  </div>
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    error={errors.email}
                  />
                  <Input
                    label="Password"
                    type="password"
                    placeholder="•••••••• (Min 6 characters)"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    error={errors.password}
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    error={errors.confirmPassword}
                  />
                  <Button variant="primary" onClick={nextStep} className="w-full gap-2 mt-4">
                    Continue Details <ChevronRight className="h-4.5 w-4.5" />
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/80" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-3 text-muted-foreground font-semibold">Or register via</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    type="button"
                    onClick={loginWithGoogle}
                    disabled={loading}
                    className="w-full h-11 border border-border font-medium hover:bg-muted/40 rounded-xl gap-2.5"
                  >
                    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.1h3.99c2.34-2.16 3.69-5.35 3.69-8.72z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.99-3.1c-1.1.74-2.51 1.18-3.97 1.18-3.05 0-5.63-2.06-6.55-4.83H1.377v3.2A11.99 11.99 0 0 0 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.45 14.34a7.16 7.16 0 0 1 0-4.68V6.46H1.377a11.99 11.99 0 0 0 0 11.08l4.073-3.2z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A11.99 11.99 0 0 0 1.377 6.46L5.45 9.66c.92-2.77 3.5-4.83 6.55-4.83z"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-4 text-left"
                >
                  <div className="text-center pb-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Personal Information</h2>
                    <p className="text-xs text-muted-foreground mt-1">Provide contact info for QR verification matches</p>
                  </div>
                  <Input
                    label="Full Name"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    error={errors.fullName}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Age"
                      type="number"
                      placeholder="25"
                      value={formData.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                      error={errors.age}
                    />
                    <Select
                      label="Gender"
                      value={formData.gender}
                      onChange={(e) => handleInputChange("gender", e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-Binary">Non-Binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </Select>
                  </div>
                  <Input
                    label="Phone Number"
                    placeholder="10-digit mobile"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    error={errors.phone}
                  />

                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" onClick={prevStep} className="flex-1">
                      Back
                    </Button>
                    <Button variant="primary" onClick={nextStep} className="flex-1 gap-2">
                      Avatar setup <ChevronRight className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6 text-left"
                >
                  <div className="text-center pb-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile Photo Upload</h2>
                    <p className="text-xs text-muted-foreground mt-1">Choose a modern avatar or upload a picture for vaccine passes</p>
                  </div>

                  <div className="flex justify-center mb-6">
                    <div className="relative border-4 border-primary/20 rounded-full p-1 bg-white">
                      <img
                        src={formData.avatar}
                        alt="Profile Avatar Preview"
                        className="h-28 w-28 rounded-full object-cover bg-slate-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block text-center">
                      Select modern profile avatar
                    </label>
                    <div className="grid grid-cols-6 gap-3">
                      {avatarOptions.map((avUrl, i) => (
                        <button
                          key={i}
                          onClick={() => handleInputChange("avatar", avUrl)}
                          className={`rounded-xl overflow-hidden border-2 p-0.5 bg-white transition-all hover:scale-105 ${
                            formData.avatar === avUrl ? "border-primary shadow-glow" : "border-transparent"
                          }`}
                        >
                          <img src={avUrl} alt={`Avatar option ${i}`} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Simulated Upload Button */}
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateRandom}
                      className="text-xs border-border/80"
                    >
                      <Sparkles className="h-4 w-4 mr-1 text-accent" /> Regenerate Random
                    </Button>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" onClick={prevStep} className="flex-1">
                      Back
                    </Button>
                    <Button variant="primary" onClick={nextStep} className="flex-1 gap-2">
                      Review <ChevronRight className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-5 text-left"
                >
                  <div className="text-center pb-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Review & Confirmation</h2>
                    <p className="text-xs text-muted-foreground mt-1">Check that all information matches official documentation</p>
                  </div>

                  {errors.apiError && (
                    <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-medium">
                      {errors.apiError}
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-muted/30 border space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Full Name</span>
                      <span className="font-semibold text-slate-800 dark:text-white">{formData.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Email</span>
                      <span className="font-semibold text-slate-800 dark:text-white truncate max-w-[180px]">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Phone</span>
                      <span className="font-semibold text-slate-800 dark:text-white">{formData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Age / Gender</span>
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {formData.age} yrs / {formData.gender}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs text-muted-foreground leading-normal">
                    <input
                      type="checkbox"
                      id="consent"
                      required
                      className="rounded border-border text-primary h-4.5 w-4.5 mt-0.5 cursor-pointer"
                    />
                    <label htmlFor="consent" className="cursor-pointer select-none">
                      I agree to the vaccine information consent and confirm that the details entered match my official government identity cards.
                    </label>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" onClick={prevStep} className="flex-1" disabled={loading}>
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleRegister}
                      disabled={loading}
                      className="flex-1 gap-2"
                    >
                      {loading ? "Creating account..." : "Submit Registration"} <CheckCircle className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-6 text-center py-6"
                >
                  <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-success/10 text-success flex items-center justify-center border border-success/20 animate-bounce">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Setup Successful!</h2>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Your campaign account has been created. You can now schedule vaccination slots.
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    onClick={() => navigate("/dashboard")}
                    className="w-full max-w-xs"
                  >
                    Go to Dashboard
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Login link removed since we have tabs now */}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ShieldCheck, CheckCircle, CreditCard, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Footer } from "@/components/Footer"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"

const CAROUSEL_IMAGES = [
  "https://tse2.mm.bing.net/th/id/OIP.FL-IAnqHBQnH9ljlfLRGiwHaE8?pid=Api&P=0",
  "/assets/img3.png",
  "/assets/certificate.png"
]

export const LandingPage = () => {
  const navigate = useNavigate()
  const { currentUser, handleGoogleCallback } = useAuth()
  const { showToast } = useToast()
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const hasProcessedCode = useRef(false)
  
  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_IMAGES.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % CAROUSEL_IMAGES.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    if (code && !hasProcessedCode.current) {
      hasProcessedCode.current = true
      setIsAuthenticating(true)
      handleGoogleCallback(code)
        .then((user) => {
          showToast(`Welcome, ${user.fullName}! Authenticated via Google.`, "success")
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
          navigate("/login", { replace: true })
        })
        .finally(() => {
          setIsAuthenticating(false)
        })
    }
  }, [handleGoogleCallback, navigate, showToast])

  const howItWorks = [
    {
      title: "Fill the form",
      desc: "Tell us your details and pick a vaccine + slot.",
      icon: <FileText className="h-6 w-6" />
    },
    {
      title: "Secure payment",
      desc: "Pay through Razorpay and receive a unique registration ID.",
      icon: <CreditCard className="h-6 w-6" />
    },
    {
      title: "Admin approval",
      desc: "The admin team reviews and approves completed payments.",
      icon: <ShieldCheck className="h-6 w-6" />
    },
    {
      title: "Download receipt",
      desc: "Download your approved PDF receipt from the dashboard.",
      icon: <CheckCircle className="h-6 w-6" />
    }
  ]

  if (isAuthenticating) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white p-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-slate-950 to-slate-950 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-premium max-w-md w-full p-8 rounded-3xl border border-white/10 shadow-premium text-center space-y-6 relative"
        >
          <div className="relative flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center mb-4">
              <div className="absolute h-16 w-16 rounded-full border-4 border-primary/30 animate-ping" />
              <div className="h-16 w-16 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <ShieldCheck className="absolute h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-white">Google OAuth Authentication</h3>
              <p className="text-slate-400 text-sm">Exchanging secure authorization credentials. Please do not close or reload the page.</p>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 bg-gradient-to-b from-blue-50/50 via-white to-transparent dark:from-slate-950 dark:via-slate-900/60 dark:to-transparent">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Headline and CTAs */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6 text-left"
          >
            <div className="inline-flex items-center gap-2 text-slate-500 uppercase tracking-[0.2em] text-[10px] sm:text-xs font-bold mb-2">
              COMMUNITY HEALTH INITIATIVE · 2026
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-slate-900 dark:text-white">
              Protect today.<br />
              <span className="text-[#114B3A] dark:text-[#38a169]">Prevent for life.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              The Rotaract Club of Osmania Medical College is organising an on-campus vaccination drive offering <strong className="text-slate-800 dark:text-slate-200">Hepatitis B (HBV)</strong> and <strong className="text-slate-800 dark:text-slate-200">Human Papillomavirus (HPV)</strong> vaccines at affordable rates. Register online, pay securely, and download your approved receipt after admin verification.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(currentUser ? "/book" : "/register")}
                className="w-full sm:w-auto rounded-full px-8 font-bold bg-[#114B3A] hover:bg-[#0C362A] text-white shadow-md"
              >
                Book Your Slot
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  document.getElementById('vaccines')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="w-full sm:w-auto rounded-full px-8 font-bold border-border/60 hover:bg-slate-50"
              >
                View Vaccines
              </Button>
            </div>
          </motion.div>

          {/* Visual Graphic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 flex justify-center relative"
          >
            {/* Background glowing decorations */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl -z-10 animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-accent/20 to-success/20 rounded-full blur-3xl -z-10" />

            <div className="relative glass-premium p-8 rounded-3xl border border-white/20 dark:border-white/5 shadow-premium max-w-sm w-full animate-float">
              <div className="flex justify-between items-center mb-6">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <Badge variant="success">Active Camp</Badge>
              </div>

              {/* Vaccine pass mock */}
              <div className="space-y-4 text-left">
                <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="border-t border-border/60 dark:border-border/10 my-4" />
                
                <div className="h-44 w-44 mx-auto bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center border border-border/50 dark:border-border/10">
                  <FileText className="h-24 w-24 text-slate-800 dark:text-slate-200" />
                </div>
                <div className="text-center font-bold text-xs uppercase tracking-widest text-muted-foreground pt-2">
                  ID: VAC-2026-A92B
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* About The Club Section */}
      <section className="py-20 bg-white dark:bg-slate-900 border-y border-border">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <h4 className="text-sm font-bold tracking-widest text-slate-500 uppercase">About the Club</h4>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Future physicians serving the community.
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                The Rotaract Club of Osmania Medical College is a service-oriented student chapter committed to public health, awareness camps and outreach. This drive is part of our ongoing initiative to expand preventive care in underserved communities across Hyderabad.
              </p>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 border border-border rounded-xl">
                  <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-1">Founded</p>
                  <p className="font-semibold text-slate-900 dark:text-white">Osmania Medical College</p>
                </div>
                <div className="p-4 border border-border rounded-xl">
                  <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-1">Focus</p>
                  <p className="font-semibold text-slate-900 dark:text-white">Preventive healthcare</p>
                </div>
                <div className="p-4 border border-border rounded-xl">
                  <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-1">Volunteers</p>
                  <p className="font-semibold text-slate-900 dark:text-white">80+ medical students</p>
                </div>
                <div className="p-4 border border-border rounded-xl">
                  <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-1">Partners</p>
                  <p className="font-semibold text-slate-900 dark:text-white">Rotary District 3150</p>
                </div>
              </div>
            </div>
            <div className="relative h-[250px] sm:h-[400px] lg:h-[500px] w-full rounded-3xl overflow-hidden shadow-premium group">
              {CAROUSEL_IMAGES.map((src, idx) => (
                <img 
                  key={idx}
                  src={src} 
                  alt={`Osmania Medical College Slide ${idx + 1}`} 
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${currentSlide === idx ? "opacity-100" : "opacity-0"}`} 
                />
              ))}
              
              {/* Navigation Arrows */}
              <button 
                onClick={prevSlide} 
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60 hover:scale-110"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button 
                onClick={nextSlide} 
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60 hover:scale-110"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              {/* Slide Indicators */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {CAROUSEL_IMAGES.map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setCurrentSlide(idx)} 
                    className={`h-2 rounded-full transition-all duration-300 ${currentSlide === idx ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`} 
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-950">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              How it works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Four simple steps from registration to vaccination day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, idx) => (
              <div key={idx} className="relative p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-border text-center flex flex-col items-center">
                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Vaccines Section */}
      <section id="vaccines" className="py-20 bg-white dark:bg-slate-900 border-y border-border">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative h-[250px] sm:h-[400px] w-full rounded-3xl overflow-hidden shadow-premium bg-[#DED6D8]">
              <img src="https://www.news-medical.net/image-handler/picture/2020/7/shutterstock_616263095.jpg" alt="Vaccine vial" className="object-cover h-full w-full" />
            </div>
            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-sm font-bold tracking-widest text-slate-500 uppercase">The Vaccines</h4>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Two vaccines. Lifelong protection.
                </h2>
              </div>
              
              <div className="space-y-6">
                <div className="pl-4 border-l-4 border-primary">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Hepatitis B Vaccine (HBV)</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Protects against the Hepatitis B virus that can cause chronic liver disease. Available as a single booster (₹400) or full 3-dose course (₹1,050).
                  </p>
                </div>
                
                <div className="pl-4 border-l-4 border-[#F59E0B]">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">HPV Vaccine</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Recommended for adolescents and young adults to prevent HPV-linked cancers. Single dose (₹1,800) or full 2-dose course (₹3,400).
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate("/book")}
                className="bg-[#114B3A] hover:bg-[#0C362A] text-white px-8 py-6 rounded-full font-bold shadow-md"
              >
                Book My Vaccine
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* For Volunteers Banner */}
      <section className="py-12 bg-[#114B3A] text-white">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-[#38A169] text-sm font-bold tracking-widest uppercase">
              <FileText className="h-4 w-4" /> For Volunteers
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Verify registrations & export records on drive day.
            </h2>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/admin")}
            className="bg-white text-[#114B3A] hover:bg-slate-100 hover:text-[#114B3A] border-0 rounded-full px-8 font-bold whitespace-nowrap"
          >
            Admin Login
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}

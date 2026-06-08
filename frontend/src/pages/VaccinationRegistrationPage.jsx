import { Fragment, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, ChevronRight, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Input, Select } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"

const RAZORPAY_CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js"

const loadRazorpayCheckout = () => {
  if (window.Razorpay) return Promise.resolve(true)

  const existingScript = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_SCRIPT}"]`)
  if (existingScript) {
    return new Promise((resolve) => {
      existingScript.addEventListener("load", () => resolve(true), { once: true })
      existingScript.addEventListener("error", () => resolve(false), { once: true })
    })
  }

  return new Promise((resolve) => {
    const script = document.createElement("script")
    script.src = RAZORPAY_CHECKOUT_SCRIPT
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export const VaccinationRegistrationPage = () => {
  const navigate = useNavigate()
  const { currentUser, vaccines, addBooking, createPaymentOrder, verifyPayment } = useAuth()
  const { showToast } = useToast()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [selectedIds, setSelectedIds] = useState(["ceravac-hpv"])
  
  // Booking Form State
  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || "",
    phone: currentUser?.phone || "",
    email: currentUser?.email || "",
    age: currentUser?.age || "",
    gender: currentUser?.gender || "Male",
    vaccineId: vaccines[0]?.id || "",
    dose: "Dose 1",
    appointmentDate: "",
    appointmentSlot: "10:00 AM - 12:00 PM",
    paymentMode: "Razorpay",
    paymentId: "",
  })

  useEffect(() => {
    if (!currentUser) {
      showToast("Please sign in to register for vaccinations.", "info")
      navigate("/login")
    }
  }, [currentUser, navigate, showToast])

  useEffect(() => {
    if (vaccines.length > 0 && !formData.vaccineId) {
      setFormData((prev) => ({ ...prev, vaccineId: vaccines[0].id }))
    }
  }, [vaccines, formData.vaccineId])

  useEffect(() => {
    let targetId = "";
    if (selectedIds.includes("ceravac-hpv") && selectedIds.includes("revac-b-hbv")) {
      targetId = "both";
    } else if (selectedIds.includes("ceravac-hpv")) {
      targetId = "ceravac-hpv";
    } else if (selectedIds.includes("revac-b-hbv")) {
      targetId = "revac-b-hbv";
    } else {
      targetId = "ceravac-hpv";
    }
    setFormData((prev) => ({ ...prev, vaccineId: targetId }));
  }, [selectedIds]);

  if (!currentUser) {
    return null
  }

  // Selected vaccine details
  const selectedVaccine = vaccines.find((v) => v.id === formData.vaccineId) || vaccines[0]

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleVaccineToggle = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length > 1) {
          return prev.filter((x) => x !== id)
        }
        return prev
      } else {
        return [...prev, id]
      }
    })
  }

  const validateStep = (currentStep) => {
    const stepErrors = {}
    if (currentStep === 1) {
      if (!formData.fullName) stepErrors.fullName = "Full Name is required."
      if (!formData.phone) stepErrors.phone = "Phone number is required."
      if (!formData.age) stepErrors.age = "Age is required."
      // Address validation removed
    }
    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setStep((prev) => prev - 1)
  }

  const handlePaymentSubmit = async () => {
    setLoading(true)
    try {
      // 1. Add Booking
      const registration = await addBooking(formData)
      
      // 2. Create Razorpay Order
      const order = await createPaymentOrder(registration.id)
      
      // 3. Handle Mock Payment
      if (order.mock) {
          const verifyResult = await verifyPayment({
              registrationId: registration.id,
              mock: true
          });
          showToast("Mock Payment Successful!", "success")
          setFormData((prev) => ({ ...prev, id: registration.id, paymentId: verifyResult.paymentId }))
          navigate("/payment-success", {
            replace: true,
            state: {
              ...verifyResult,
              registrationId: verifyResult.registrationId || registration.id,
              amount: verifyResult.amount || registration.paymentAmount,
            },
          })
          return;
      }

      // 4. Handle Real Razorpay Payment
      const checkoutKey = order.keyId || ""
      if (!checkoutKey) {
        showToast("Payment key is missing. Please check Razorpay configuration.", "error")
        return
      }

      const gatewayLoaded = await loadRazorpayCheckout()
      if (!gatewayLoaded || !window.Razorpay) {
        showToast("Payment gateway failed to load.", "error")
        return
      }

      const options = {
        key: checkoutKey,
        amount: order.amount,
        currency: order.currency,
        name: "Rotaract Club of OMC",
        description: "Vaccination Drive",
        order_id: order.id,
        handler: async function (response) {
            try {
              const result = await verifyPayment({
                registrationId: registration.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              });
              showToast("Payment Successful!", "success")
              setFormData((prev) => ({ ...prev, id: registration.id, paymentId: result.paymentId }))
              navigate("/payment-success", {
                replace: true,
                state: {
                  ...result,
                  registrationId: result.registrationId || registration.id,
                  amount: result.amount || registration.paymentAmount,
                },
              })
            } catch (verifyErr) {
              showToast(verifyErr.response?.data?.error || "Payment verification failed.", "error")
            }
        },
        prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.phone
        },
        theme: {
            color: "#114B3A"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();

    } catch (err) {
      showToast(err.response?.data?.error || "Payment processing failed. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 sm:px-6 min-h-[calc(100vh-4rem)]">
      
      {/* Header Info */}
      <div className="text-left mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Immunization Registration
        </h1>
        <p className="text-sm text-muted-foreground">
          Schedule your dose, collect premium booking confirmations, and check-in smoothly at the drive.
        </p>
      </div>

      {/* Booking Timeline */}
      {step < 4 && (
        <div className="mb-10 max-w-2xl mx-auto flex items-center justify-between px-2">
          {[1, 2, 3].map((s) => (
            <Fragment key={s}>
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all border ${
                    step >= s
                      ? "bg-primary border-primary text-white shadow-glow"
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  {step > s ? <CheckCircle2 className="h-4.5 w-4.5" /> : s}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1.5 hidden sm:inline">
                  {s === 1 ? "Details" : s === 2 ? "Vaccine" : "Payment"}
                </span>
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-0.5 mx-2 -mt-4 sm:-mt-0 transition-all ${
                    step > s ? "bg-primary" : "bg-border/60 dark:bg-border/10"
                  }`}
                />
              )}
            </Fragment>
          ))}
        </div>
      )}

      {/* Form Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Steps Card */}
        <div className={step === 1 ? "lg:col-span-12 max-w-3xl mx-auto w-full" : "lg:col-span-8"}>
          <Card className="border border-border/80 shadow-premium">
            <CardContent className="pt-6">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 text-left"
                  >
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white border-b pb-2">
                      Personal Booking Details
                    </h3>
                    <Input
                      label="Recipient Full Name"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      error={errors.fullName}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Recipient Age"
                        type="number"
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
                        <option value="Other">Other</option>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Phone Number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        error={errors.phone}
                      />
                      <Input
                        label="Email Address (Optional)"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border/30">
                      <Button variant="primary" onClick={handleNext} className="gap-2 px-6">
                        Next: Choose Vaccine <ChevronRight className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6 text-left"
                  >
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white border-b pb-2">
                      Vaccine Selection
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {vaccines.filter((v) => v.id !== "both").map((v) => {
                        const isSelected = selectedIds.includes(v.id);
                        return (
                          <div
                            key={v.id}
                            onClick={() => handleVaccineToggle(v.id)}
                            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between h-40 bg-card hover:border-primary/60 ${
                              isSelected
                                ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-glow"
                                : "border-border"
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-center mb-2 gap-2">
                                <h4 className="font-bold text-base text-slate-900 dark:text-white pr-2 truncate">{v.name}</h4>
                                <Badge variant={isSelected ? "primary" : "outline"} className="shrink-0">
                                  {v.doses} Doses
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground leading-normal">
                                Fully approved vaccine for active immunization drives.
                              </p>
                            </div>
                            <div className="text-lg font-extrabold text-slate-900 dark:text-white pt-2 border-t border-border/10">
                              ₹{v.price.toLocaleString("en-IN")}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Vaccine Dose Number
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {["Dose 1", "Dose 2", "Booster"].map((d) => (
                          <button
                            key={d}
                            onClick={() => handleInputChange("dose", d)}
                            className={`h-11 rounded-xl font-medium border text-sm transition-all ${
                              formData.dose === d
                                ? "bg-primary border-primary text-white shadow-glow"
                                : "bg-card border-border hover:bg-muted text-foreground"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-border/30">
                      <Button variant="outline" onClick={handleBack}>
                        Back
                      </Button>
                      <Button variant="primary" onClick={handleNext} className="gap-2 px-6">
                        Next: Payment <ChevronRight className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6 text-left"
                  >
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white border-b pb-2">
                      Secure Checkout
                    </h3>

                    <div className="space-y-3 bg-muted/30 p-5 rounded-2xl border border-border">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          You are about to pay <span className="font-semibold text-slate-900 dark:text-white text-base">₹{selectedVaccine.price.toLocaleString("en-IN")}</span> for your vaccination appointment. 
                          Clicking below will securely open the Razorpay payment gateway where you can use UPI, Google Pay, PhonePe, Cards or Net Banking.
                        </p>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-border/30">
                      <Button variant="outline" onClick={handleBack} disabled={loading}>
                        Back
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handlePaymentSubmit}
                        disabled={loading}
                        className="gap-2 px-6 bg-[#114B3A] hover:bg-[#0C362A]"
                      >
                        {loading ? "Processing..." : "Pay Securely"} <CheckCircle2 className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {step >= 2 && step < 4 && (
          <div className="lg:col-span-4">
            <Card glass className="border border-border/80 p-5 space-y-5 text-left shadow-premium">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Vaccine Booking</h4>
                <div className="text-lg font-bold text-slate-900 dark:text-white">{selectedVaccine?.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formData.vaccineId === "both"
                    ? `${formData.dose} for both HPV and HBV`
                    : `${formData.dose} appointment`}
                </div>
              </div>

              <div className="border-t border-border/60 dark:border-border/10 my-3" />

              <div className="space-y-2.5 text-sm">
                {formData.vaccineId === "both" ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ceravac-HPV Price</span>
                      <span className="font-medium">₹1,300</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revac-B+ Price</span>
                      <span className="font-medium">₹75</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dose Base Price</span>
                    <span className="font-medium">₹{selectedVaccine?.price.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admin Fee</span>
                  <span className="font-medium text-success">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Convenience Tax</span>
                  <span className="font-medium text-success">₹0</span>
                </div>
                <div className="border-t border-dashed border-border/60 my-2" />
                <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white">
                  <span>Grand Total</span>
                  <span>₹{selectedVaccine?.price.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

      </div>

    </div>
  )
}

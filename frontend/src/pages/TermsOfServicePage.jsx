import { FileText, AlertTriangle } from "lucide-react"

export const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-10 text-center">
          <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Terms of Service</h1>
          <p className="mt-4 text-muted-foreground">Effective Date: October 2023</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-border shadow-sm rounded-2xl p-8 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              By accessing and using this vaccination drive management platform ("Platform"), you agree to abide by these Terms of Service. If you do not agree, please refrain from using the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">2. Eligibility</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              The platform is intended for use by individuals seeking vaccination appointments as part of the Rotaract Club of Osmania Medical College's initiative. You must provide accurate and complete information during registration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">3. Medical Disclaimer</h2>
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-lg p-4 mb-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
              <p className="text-sm text-orange-800 dark:text-orange-300">
                This platform is for scheduling and management purposes only. It does not provide medical advice. Consult a healthcare professional if you have specific medical questions or concerns regarding the vaccines.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">4. Payment & Mock Transactions</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Payments made on this platform might be handled via a simulated environment or third-party payment gateways depending on the campaign phase. Users must ensure that any transaction details or screenshots uploaded are genuine. Fraudulent entries will lead to the cancellation of your appointment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">5. Limitation of Liability</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              The Rotaract Club of Osmania Medical College and its affiliates are not liable for any direct, indirect, or incidental damages arising out of the use of this platform or the vaccination drive, except where mandated by law.
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-slate-500">
              For questions regarding these Terms, please contact <a href="mailto:support@rotaractomc.org" className="text-primary hover:underline">support@rotaractomc.org</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

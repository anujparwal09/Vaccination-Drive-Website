import { ShieldCheck, Lock } from "lucide-react"

export const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-10 text-center">
          <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Privacy & Consent Policy</h1>
          <p className="mt-4 text-muted-foreground">Effective Date: October 2023</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-border shadow-sm rounded-2xl p-8 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-primary" /> Data Collection & HIPAA Compliance
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              The Rotaract Club of Osmania Medical College prioritizes the privacy and security of your personal and medical information. Our platform complies with general health data protection guidelines. We collect basic personal information (name, age, gender, contact details) strictly for the purpose of organizing and managing the HBV and HPV Vaccination Drive.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
              <li>To schedule and confirm vaccination appointments.</li>
              <li>To communicate important updates regarding the drive.</li>
              <li>To securely maintain medical records as required by local health authorities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Consent for Treatment</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              By registering on this platform, you provide explicit consent to receive the requested vaccinations (HBV/HPV) administered by certified medical professionals during the drive. You acknowledge that you have consulted with a medical professional regarding any allergies or pre-existing conditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Data Security</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Your data is encrypted and securely stored. We do not sell or share your personal information with third-party marketers. Access to medical records is restricted to authorized medical officers and campaign administrators.
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-slate-500">
              If you have any concerns regarding your privacy or wish to request the deletion of your records, please contact our Support Officer at <a href="mailto:support@rotaractomc.org" className="text-primary hover:underline">support@rotaractomc.org</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

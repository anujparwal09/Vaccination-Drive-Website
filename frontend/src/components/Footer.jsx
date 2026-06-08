import { Heart, Mail, Phone, MapPin } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

export const Footer = () => {
  const location = useLocation()
  
  // Hide footer on admin panel pages for security and clean UI
  if (location.pathname.startsWith("/admin")) {
    return null
  }

  return (
    <footer className="w-full bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Top Section */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Info Column */}
        <div className="space-y-4 text-left">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-white shadow-premium overflow-hidden border border-border/50">
              <img src="/assets/logo_round.jpg" alt="Rotaract Logo" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-[1rem] leading-tight">
                Rotaract Club of <br />Osmania Medical College
              </span>
            </div>
          </div>
          <p className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-[#38a169] uppercase mt-1">
            HBV · HPV VACCINATION DRIVE
          </p>
          <p className="text-sm text-slate-400 leading-relaxed mt-3">
            Smart Vaccination Drive Management Platform built for hospitals, NGOs, immunization camps, and corporate health programs.
          </p>
          <div className="flex space-x-4 pt-2">
            <a href="https://www.instagram.com/rotaract_omc/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-primary transition-colors text-slate-400">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.012-3.584.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.822a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
            <a href="https://in.linkedin.com/company/rotaract-club-of-omc?trk=public_profile_topcard-current-company" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-primary transition-colors text-slate-400">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a href="https://github.com/anujparwal09/Vaccination-Drive-Website" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-primary transition-colors text-slate-400">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Links Column */}
        <div className="space-y-4 text-left">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Platform</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/book" className="hover:text-white transition-colors text-slate-400">Book Appointment</Link></li>
            <li><Link to="/login" className="hover:text-white transition-colors text-slate-400">User Dashboard</Link></li>
            <li><Link to="/admin" className="hover:text-white transition-colors text-slate-400">Verification Pass</Link></li>
            <li><a href="#" className="hover:text-white transition-colors text-slate-400">Schedule & Calendar</a></li>
          </ul>
        </div>

        {/* Resources Column */}
        <div className="space-y-4 text-left">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Support & FAQs</h4>
          <ul className="space-y-2.5 text-sm">
            <li><a href="https://omc.ac.in/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors text-slate-400">Help Center</a></li>
            <li><Link to="/privacy" className="hover:text-white transition-colors text-slate-400">Privacy & Consent</Link></li>
            <li><Link to="/terms" className="hover:text-white transition-colors text-slate-400">Terms of Service</Link></li>
            <li><a href="tel:+919325339930" className="hover:text-white transition-colors text-slate-400">Contact Medical Officer</a></li>
          </ul>
        </div>

        {/* Contact Column */}
        <div className="space-y-4 text-left">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Contact Info</h4>
          <ul className="space-y-3 text-sm text-slate-400">
            <li className="flex items-start gap-2.5">
              <Mail className="h-4.5 w-4.5 text-primary mt-0.5 shrink-0" />
              <a href="mailto:support@rotaractomc.org" className="hover:text-white transition-colors">support@rotaractomc.org</a>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone className="h-4.5 w-4.5 text-primary mt-0.5 shrink-0" />
              <a href="tel:+919325339930" className="hover:text-white transition-colors">+91 93253 39930</a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="h-4.5 w-4.5 text-primary mt-0.5 shrink-0" />
              <a href="https://maps.google.com/?q=Immunization+HQ,+Plot+22,+Medical+Center,+Pune,+India" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors text-left">Immunization HQ, Plot 22, Medical Center, Pune, India</a>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Copyright */}
      <div className="w-full bg-slate-950/60 border-t border-slate-800/80 py-6">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Rotaract Club of Osmania Medical College. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-3.5 w-3.5 text-error fill-error animate-pulse" /> for safer, healthier vaccination campaigns.
          </p>
        </div>
      </div>
    </footer>
  )
}

import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { Mascot } from '@/components/brand/Mascot';
import { MapPin, ShieldCheck, Heart, Lock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-[#F0DFC8] mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <Logo size="md" />
            <p className="text-sm font-bold text-[#E8772E]">
              "Smart Rentals. Smooth Journeys."
            </p>
            <p className="text-xs text-[#735340] max-w-md leading-relaxed">
              Vulpi is inspired by the fox (Vulpes): clever, agile, and quick to find the right ride. We connect renters with verified car owners in Cagayan de Oro City without the endless back-and-forth phone calls or social media messaging.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-[#735340] pt-1">
              <MapPin className="w-3.5 h-3.5 text-[#1AA3A3]" />
              <span>Cagayan de Oro City, Northern Mindanao, Philippines</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#3B2216]">Explore</h4>
            <ul className="space-y-1.5 text-xs text-[#735340]">
              <li>
                <Link href="/cars" className="hover:text-[#E8772E]">All Available Cars</Link>
              </li>
              <li>
                <Link href="/cars?type=suv" className="hover:text-[#E8772E]">SUVs in CDO</Link>
              </li>
              <li>
                <Link href="/cars?type=sedan" className="hover:text-[#E8772E]">Sedans for City Driving</Link>
              </li>
              <li>
                <Link href="/cars?type=van" className="hover:text-[#E8772E]">Passenger Vans</Link>
              </li>
              <li>
                <Link href="/cars?dest=outside_cdo" className="hover:text-[#E8772E]">Out-of-City Trips</Link>
              </li>
            </ul>
          </div>

          {/* For Owners */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#3B2216]">For Car Owners</h4>
            <ul className="space-y-1.5 text-xs text-[#735340]">
              <li>
                <Link href="/signup" className="hover:text-[#E8772E]">List Your Car</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#E8772E]">Owner Sign In</Link>
              </li>
              <li>
                <Link href="/owner/dashboard" className="hover:text-[#E8772E]">Owner Dashboard</Link>
              </li>
              <li>
                <span className="text-[11px] text-[#1AA3A3] font-semibold flex items-center gap-1 mt-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Direct Renter Handovers
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#F0DFC8]/60 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#735340]">
          <p>Copyright © 2026 Vulpi Car Rental Marketplace. All Rights Reserved.</p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
            <Link href="/" className="hover:text-[#E8772E] transition-colors">Home</Link>
            <Link href="/cars" className="hover:text-[#E8772E] transition-colors">Browse Cars</Link>
            <Link href="/signup" className="hover:text-[#E8772E] transition-colors">List Your Car</Link>
            <span className="text-[#D4C3B3]">|</span>
            <Link
              href="/login?redirect=%2Fadmin"
              className="inline-flex items-center gap-1 font-semibold text-[#735340] hover:text-[#E8772E] transition-colors"
            >
              <Lock className="w-3 h-3 text-[#E8772E]" />
              <span>Admin Login</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

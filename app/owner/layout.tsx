import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { signOutAction } from '@/app/actions/auth';
import { LayoutDashboard, Car, Inbox, FileText, Settings, LogOut } from 'lucide-react';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FFFBF5]">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#F0DFC8] px-4 py-3 flex items-center justify-between shadow-xs">
        <Logo size="sm" href="/owner/dashboard" />
        <div className="flex items-center gap-2">
          <Link
            href="/owner/settings"
            className="p-2 rounded-xl text-[#735340] hover:bg-[#FAF0E4] hover:text-[#3B2216] transition-colors"
            title="Account Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="p-2 rounded-xl text-[#735340] hover:bg-[#FAF0E4] hover:text-[#3B2216] transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#F0DFC8] bg-white p-6 justify-between shrink-0 min-h-screen sticky top-0">
        <div className="space-y-8">
          <Logo size="md" withTagline href="/owner/dashboard" />

          <nav className="space-y-1.5">
            <Link
              href="/owner/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-[#3B2216] hover:bg-[#FAF0E4] transition-colors"
            >
              <LayoutDashboard className="w-5 h-5 text-[#E8772E]" />
              Dashboard
            </Link>
            <Link
              href="/owner/cars"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-[#3B2216] hover:bg-[#FAF0E4] transition-colors"
            >
              <Car className="w-5 h-5 text-[#1AA3A3]" />
              My Cars
            </Link>
            <Link
              href="/owner/requests"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-[#3B2216] hover:bg-[#FAF0E4] transition-colors"
            >
              <Inbox className="w-5 h-5 text-[#E8772E]" />
              Requests Inbox
            </Link>
            <Link
              href="/owner/terms"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-[#3B2216] hover:bg-[#FAF0E4] transition-colors"
            >
              <FileText className="w-5 h-5 text-[#1AA3A3]" />
              Rental Terms
            </Link>
            <Link
              href="/owner/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-[#3B2216] hover:bg-[#FAF0E4] transition-colors"
            >
              <Settings className="w-5 h-5 text-[#735340]" />
              Account Settings
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-[#F0DFC8]">
          <div className="mb-4 text-xs text-[#735340]">
            <span className="font-semibold text-[#3B2216] block">Owner Portal</span>
            Cagayan de Oro City
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm text-red-700 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-6xl mx-auto w-full">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (optimized for touch targets) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#F0DFC8] px-2 py-2 flex items-center justify-around shadow-lg">
        <Link
          href="/owner/dashboard"
          className="flex flex-col items-center gap-1 p-2 text-[11px] font-bold text-[#735340] hover:text-[#E8772E]"
        >
          <LayoutDashboard className="w-5 h-5 text-[#E8772E]" />
          <span>Home</span>
        </Link>
        <Link
          href="/owner/cars"
          className="flex flex-col items-center gap-1 p-2 text-[11px] font-bold text-[#735340] hover:text-[#1AA3A3]"
        >
          <Car className="w-5 h-5 text-[#1AA3A3]" />
          <span>Cars</span>
        </Link>
        <Link
          href="/owner/requests"
          className="flex flex-col items-center gap-1 p-2 text-[11px] font-bold text-[#735340] hover:text-[#E8772E]"
        >
          <Inbox className="w-5 h-5 text-[#E8772E]" />
          <span>Requests</span>
        </Link>
        <Link
          href="/owner/terms"
          className="flex flex-col items-center gap-1 p-2 text-[11px] font-bold text-[#735340] hover:text-[#1AA3A3]"
        >
          <FileText className="w-5 h-5 text-[#1AA3A3]" />
          <span>Terms</span>
        </Link>
        <Link
          href="/owner/settings"
          className="flex flex-col items-center gap-1 p-2 text-[11px] font-bold text-[#735340] hover:text-[#E8772E]"
        >
          <Settings className="w-5 h-5 text-[#735340]" />
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
}

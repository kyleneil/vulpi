'use client';

import { useState } from 'react';
import { updatePasswordAction, signOutAction } from '@/app/actions/auth';
import {
  Shield,
  KeyRound,
  LogOut,
  X,
  CheckCircle2,
  AlertCircle,
  Lock,
  Mail,
  Server,
  Send,
  Cloud,
  Check,
} from 'lucide-react';

interface AdminProfileModalProps {
  adminEmail: string;
}

export function AdminProfileModal({ adminEmail }: AdminProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    setPasswordSuccess('');
    setPasswordError('');

    const formData = new FormData(e.currentTarget);
    const res = await updatePasswordAction(formData);
    setIsUpdatingPassword(false);

    if (res?.error) {
      setPasswordError(res.error);
    } else if (res?.success) {
      setPasswordSuccess(res.success);
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="h-10 px-4 rounded-full bg-white hover:bg-[#FAF0E4] border border-[#F0DFC8] text-[#3B2216] font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <Shield className="w-3.5 h-3.5 text-[#E8772E]" />
        <span>Admin Profile & Settings</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-[#F0DFC8] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-[#FFFBF5] border-b border-[#F0DFC8] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF4E6] flex items-center justify-center text-[#E8772E]">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#3B2216]">Admin Account Profile</h2>
                  <p className="text-xs text-[#735340]">Platform Security & System Status</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF0E4] hover:bg-[#F0DFC8] text-[#3B2216] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Profile Details Card */}
              <div className="bg-[#FFFBF5] p-4 rounded-2xl border border-[#F0DFC8] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#735340]">
                    Administrator Identity
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                    Super Admin
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-[#3B2216] font-bold">
                  <Mail className="w-4 h-4 text-[#1AA3A3]" />
                  <span>{adminEmail}</span>
                </div>
                <p className="text-[11px] text-[#735340]">
                  Full access to Cagayan de Oro fleet listings, owner partner verification, and reservation ledgers.
                </p>
              </div>

              {/* Change Admin Password */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#E8772E]" />
                  <h3 className="text-sm font-bold text-[#3B2216]">Update Admin Sign-In Password</h3>
                </div>

                {passwordSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="new_password"
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216] focus:outline-none focus:ring-2 focus:ring-[#E8772E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirm_password"
                      required
                      minLength={6}
                      placeholder="Re-type new password"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216] focus:outline-none focus:ring-2 focus:ring-[#E8772E]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="h-10 px-5 rounded-full bg-[#E8772E] hover:bg-[#D4661E] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    {isUpdatingPassword ? 'Updating Password...' : 'Save New Admin Password'}
                  </button>
                </form>
              </div>

              {/* Cloud Architecture Status */}
              <div className="pt-4 border-t border-[#F0DFC8]/60 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#735340] block">
                  Cloud Services Status
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#FFFBF5] border border-[#F0DFC8] flex items-center gap-2">
                    <Server className="w-3.5 h-3.5 text-[#1AA3A3]" />
                    <span className="text-[#3B2216] font-medium">PostgreSQL Pooler</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FFFBF5] border border-[#F0DFC8] flex items-center gap-2">
                    <Cloud className="w-3.5 h-3.5 text-[#E8772E]" />
                    <span className="text-[#3B2216] font-medium">Cloudflare R2</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FFFBF5] border border-[#F0DFC8] flex items-center gap-2">
                    <Send className="w-3.5 h-3.5 text-[#0F7F82]" />
                    <span className="text-[#3B2216] font-medium">Telegram Bot</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FFFBF5] border border-[#F0DFC8] flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-amber-700" />
                    <span className="text-[#3B2216] font-medium">Gmail SMTP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#FFFBF5] border-t border-[#F0DFC8] flex items-center justify-between">
              <span className="text-[11px] text-[#735340]">Vulpi CDO Admin Security</span>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-red-700 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

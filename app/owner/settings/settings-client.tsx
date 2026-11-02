'use client';

import { useState } from 'react';
import { updatePasswordAction, updateOwnerProfileAction } from '@/app/actions/auth';
import { KeyRound, User, Lock, CheckCircle2, AlertCircle, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SettingsClientProps {
  owner: any;
  userEmail: string;
  isAdmin?: boolean;
}

export function SettingsClient({ owner, userEmail, isAdmin = false }: SettingsClientProps) {
  // Password state
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Profile state
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

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

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileSuccess('');
    setProfileError('');

    const formData = new FormData(e.currentTarget);
    const res = await updateOwnerProfileAction(formData);
    setIsUpdatingProfile(false);

    if (res?.error) {
      setProfileError(res.error);
    } else if (res?.success) {
      setProfileSuccess(res.success);
    }
  };

  return (
    <div className="space-y-8">
      {/* Change Password Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#F0DFC8] shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#F0DFC8]/60">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF4E6] flex items-center justify-center text-[#E8772E]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#3B2216]">Change Password</h2>
            <p className="text-xs text-[#735340]">
              Signed in as <span className="font-bold text-[#3B2216]">{userEmail}</span>
            </p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#735340]">
              New Password
            </label>
            <input
              type="password"
              name="new_password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216] focus:outline-none focus:ring-2 focus:ring-[#E8772E]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#735340]">
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirm_password"
              required
              minLength={6}
              placeholder="Re-type new password"
              className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216] focus:outline-none focus:ring-2 focus:ring-[#E8772E]"
            />
          </div>

          <button
            type="submit"
            disabled={isUpdatingPassword}
            className="h-11 px-6 rounded-full bg-[#E8772E] hover:bg-[#D4661E] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            {isUpdatingPassword ? 'Updating...' : 'Save New Password'}
          </button>
        </form>
      </div>

      {/* Business Details Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#F0DFC8] shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#F0DFC8]/60">
          <div className="w-10 h-10 rounded-2xl bg-[#E6F4F1] flex items-center justify-center text-[#1AA3A3]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#3B2216]">Business & Handover Info</h2>
            <p className="text-xs text-[#735340]">
              This information is shown to renters on car details and rental agreements.
            </p>
          </div>
        </div>

        {profileSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-xl">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#735340]">
              Business / Owner Name
            </label>
            <input
              type="text"
              name="name_or_business"
              defaultValue={owner.name_or_business}
              required
              className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216] focus:outline-none focus:ring-2 focus:ring-[#1AA3A3]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#735340]">
                Contact Phone
              </label>
              <input
                type="text"
                name="phone"
                defaultValue={owner.phone}
                required
                className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216] focus:outline-none focus:ring-2 focus:ring-[#1AA3A3]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#735340]">
                Facebook Messenger Link
              </label>
              <input
                type="text"
                name="messenger_link"
                defaultValue={owner.messenger_link || ''}
                placeholder="https://m.me/yourbusiness"
                className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216] focus:outline-none focus:ring-2 focus:ring-[#1AA3A3]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#735340]">
              Default Vehicle Handover & Pickup Address
            </label>
            <input
              type="text"
              name="pickup_location"
              defaultValue={owner.pickup_location}
              required
              className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216] focus:outline-none focus:ring-2 focus:ring-[#1AA3A3]"
            />
          </div>

          <button
            type="submit"
            disabled={isUpdatingProfile}
            className="h-11 px-6 rounded-full bg-[#1AA3A3] hover:bg-[#158282] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Admin Panel Link (Only visible to verified platform administrator) */}
      {isAdmin && (
        <div className="bg-[#FFF4E6] p-6 rounded-3xl border border-[#F0DFC8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#E8772E] shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#3B2216]">Vulpi Admin Portal</h3>
              <p className="text-xs text-[#735340]">
                Access full marketplace fleet management, bookings overview, and partner verification.
              </p>
            </div>
          </div>

          <Link
            href="/admin"
            className="h-10 px-5 rounded-full bg-[#3B2216] hover:bg-[#25150E] text-white text-xs font-bold flex items-center gap-2 shrink-0 transition-all self-start sm:self-auto cursor-pointer"
          >
            <span>Open Admin Panel</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

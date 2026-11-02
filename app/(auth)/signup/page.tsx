'use client';

import { useState } from 'react';
import { signupAction } from '@/app/actions/auth';
import { Logo } from '@/components/brand/Logo';
import { Mascot } from '@/components/brand/Mascot';
import Link from 'next/link';
import { UserPlus, AlertCircle } from 'lucide-react';

export default function SignupPage() {
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    const res = await signupAction(formData);

    if (res?.error) {
      setErrorMessage(res.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Logo size="lg" className="justify-center" />
        <h2 className="mt-3 text-2xl font-black text-[#3B2216]">List Your Cars on Vulpi</h2>
        <p className="mt-1 text-xs text-[#735340]">
          Connect with trusted renters across Cagayan de Oro City.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl border border-[#F0DFC8] rounded-3xl sm:px-10">
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
                Name or Business Name *
              </label>
              <input
                type="text"
                name="name_or_business"
                required
                placeholder="e.g. CDO Wheels Rental or Juan Dela Cruz"
                className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
                Mobile Phone (+63) *
              </label>
              <input
                type="tel"
                name="phone"
                required
                placeholder="0917 123 4567"
                className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
                Pickup Location in Cagayan de Oro *
              </label>
              <input
                type="text"
                name="pickup_location"
                required
                placeholder="e.g. SM City Uptown or Limketkai Center"
                className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
                Facebook Messenger Link (Optional)
              </label>
              <input
                type="url"
                name="messenger_link"
                placeholder="https://m.me/yourpage"
                className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-13 mt-2 rounded-full bg-[#1AA3A3] hover:bg-[#0F7F82] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {isSubmitting ? 'Creating account...' : 'Create Owner Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#F0DFC8]/60 text-center">
            <p className="text-xs text-[#735340]">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-[#E8772E] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

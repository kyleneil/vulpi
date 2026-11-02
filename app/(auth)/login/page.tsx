'use client';

import { useState, Suspense } from 'react';
import { loginAction } from '@/app/actions/auth';
import { Logo } from '@/components/brand/Logo';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, AlertCircle, UserPlus } from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectUrl = searchParams.get('redirect') || '/owner/dashboard';
  const isAdmin = redirectUrl.includes('admin');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    formData.set('redirect', redirectUrl);

    const res = await loginAction(formData);

    if (res?.error) {
      setErrorMessage(res.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Logo size="lg" className="justify-center" />
        <h2 className="mt-3 text-2xl font-black text-[#3B2216]">
          {isAdmin ? 'Platform Admin Sign In' : 'Sign In'}
        </h2>
        <p className="mt-1 text-xs text-[#735340]">
          {isAdmin
            ? 'Access the marketplace oversight, verify CDO partners, and monitor bookings.'
            : 'Sign in to manage your car rental listings or access platform admin.'}
        </p>
      </div>

      <div className="bg-white py-8 px-6 shadow-xl border border-[#F0DFC8] rounded-3xl sm:px-10 space-y-5">
      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="block font-bold">{errorMessage}</span>
            <span className="text-[11px] opacity-80 mt-0.5 block">
              If you haven't created an owner account yet, click <Link href="/signup" className="underline font-bold">Register your cars</Link> below to get started.
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
            Email address
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.ph"
            className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216] focus:outline-none focus:ring-2 focus:ring-[#E8772E]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            required
            placeholder="••••••••••••"
            className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216] focus:outline-none focus:ring-2 focus:ring-[#E8772E]"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-13 rounded-full bg-[#E8772E] hover:bg-[#D4661E] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#E8772E]/20 transition-all disabled:opacity-50 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="pt-4 border-t border-[#F0DFC8]/60 text-center space-y-2">
        <p className="text-xs text-[#735340]">
          New owner?{' '}
          <Link href="/signup" className="font-bold text-[#E8772E] hover:underline inline-flex items-center gap-1">
            <UserPlus className="w-3.5 h-3.5" /> Register your cars on Vulpi
          </Link>
        </p>
      </div>
    </div>
  </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="p-8 text-center text-xs text-[#735340]">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

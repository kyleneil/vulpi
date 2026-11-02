'use client';

import { useState } from 'react';
import { provisionOwnerAction } from '@/app/actions/admin';
import { UserPlus, X, KeyRound, Mail, Phone, MapPin, CheckCircle2, AlertCircle, Copy, Check, Sparkles } from 'lucide-react';

export function AddOwnerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = 'Vulpi';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPasswordValue(pass);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setError('');
    setResult(null);
    setCopied(false);
    generatePassword();
  };

  const handleClose = () => {
    setIsOpen(false);
    setResult(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const res = await provisionOwnerAction(formData);
    setIsSubmitting(false);

    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setResult(res);
    }
  };

  const getInstructionsText = () => {
    if (!result?.credentials) return '';
    const { name, email, password, loginUrl } = result.credentials;
    return `🦊 Welcome to Vulpi — Cagayan de Oro Car Rental Marketplace!

Hello ${name}, your car rental owner account has been created.

Your Sign-In Credentials:
• Portal URL: ${loginUrl}
• Email: ${email}
• Temporary Password: ${password}

How to log in and change your password:
1. Open ${loginUrl}
2. Sign in using your email and temporary password above.
3. Click "Settings" in the top navigation (or visit /owner/settings).
4. Under "Change Password", enter your preferred private password and save.
5. Head to "My Fleet" to start adding your vehicles!

Need assistance? Contact support at vulpi.cdo@gmail.com`;
  };

  const handleCopyInstructions = () => {
    navigator.clipboard.writeText(getInstructionsText());
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="h-9 px-4 rounded-full bg-[#E8772E] hover:bg-[#D66820] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
      >
        <UserPlus className="w-3.5 h-3.5" />
        <span>+ Add / Provision Car Owner</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#F0DFC8] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#F0DFC8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#FFF4E6] flex items-center justify-center text-[#E8772E]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#3B2216]">Provision Car Owner Account</h3>
                  <p className="text-xs text-[#735340]">Create owner credentials and send login instructions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-full hover:bg-[#FAF0E4] flex items-center justify-center text-[#735340] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result ? (
              /* Success View */
              <div className="space-y-5">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Account Successfully Provisioned!</p>
                    <p className="mt-0.5">
                      {result.emailSent
                        ? '✅ Login credentials and password change instructions have been sent to their email via Gmail SMTP.'
                        : '⚠️ Account created. (Email was not sent or SMTP not active; copy credentials below to share via Messenger/SMS).'}
                    </p>
                  </div>
                </div>

                <div className="bg-[#FFFBF5] border border-[#F0DFC8] rounded-2xl p-4 space-y-2 text-xs text-[#3B2216]">
                  <p className="font-bold uppercase tracking-wider text-[11px] text-[#735340]">
                    Generated Owner Credentials:
                  </p>
                  <p><strong>Owner / Business:</strong> {result.credentials.name}</p>
                  <p><strong>Email:</strong> <span className="font-mono">{result.credentials.email}</span></p>
                  <p><strong>Password:</strong> <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#F0DFC8] text-[#E8772E] font-bold">{result.credentials.password}</span></p>
                  <p><strong>Login URL:</strong> <a href={result.credentials.loginUrl} target="_blank" rel="noreferrer" className="text-[#1AA3A3] underline">{result.credentials.loginUrl}</a></p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleCopyInstructions}
                    className="w-full h-11 rounded-2xl bg-[#E8772E] hover:bg-[#D66820] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied Instructions to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Login Credentials & Instructions</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-[#735340] text-center">
                    Paste this directly to the car owner on Facebook Messenger, Viber, WhatsApp, or SMS.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="h-10 px-5 rounded-full border border-[#F0DFC8] hover:bg-[#FAF0E4] text-xs font-bold text-[#3B2216] cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Create Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#735340]">
                    Business / Owner Name *
                  </label>
                  <input
                    type="text"
                    name="name_or_business"
                    required
                    placeholder="e.g. CDO Premier Wheels"
                    className="w-full h-11 px-4 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-xs font-medium text-[#3B2216] focus:outline-none focus:ring-2 focus:ring-[#E8772E]/30"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#735340] flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="owner@gmail.com"
                      className="w-full h-11 px-4 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-xs font-medium text-[#3B2216] focus:outline-none focus:ring-2 focus:ring-[#E8772E]/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#735340] flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> Contact Phone *
                    </label>
                    <input
                      type="text"
                      name="phone"
                      required
                      placeholder="0917 123 4567"
                      className="w-full h-11 px-4 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-xs font-medium text-[#3B2216] focus:outline-none focus:ring-2 focus:ring-[#E8772E]/30"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#735340] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Pickup Location (CDO)
                  </label>
                  <input
                    type="text"
                    name="pickup_location"
                    defaultValue="Cagayan de Oro City"
                    placeholder="e.g. Limketkai / Uptown CDO"
                    className="w-full h-11 px-4 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-xs font-medium text-[#3B2216] focus:outline-none focus:ring-2 focus:ring-[#E8772E]/30"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#735340] flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5" /> Temporary Password *
                    </label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-[11px] font-bold text-[#E8772E] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> Auto-Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    name="password"
                    required
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full h-11 px-4 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] font-mono text-xs font-bold text-[#3B2216] focus:outline-none focus:ring-2 focus:ring-[#E8772E]/30"
                  />
                  <p className="text-[10px] text-[#735340]">The owner will use this to sign in and can change it in their Settings.</p>
                </div>

                {/* Email Checkbox */}
                <div className="p-3 bg-[#FFFBF5] rounded-xl border border-[#F0DFC8] flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="send_email"
                    name="send_email"
                    defaultChecked={true}
                    className="mt-0.5 rounded border-[#F0DFC8] text-[#E8772E] focus:ring-[#E8772E]"
                  />
                  <label htmlFor="send_email" className="text-xs text-[#3B2216] cursor-pointer">
                    <span className="font-bold">Email credentials to owner</span>
                    <span className="block text-[#735340] text-[11px]">
                      Sends an onboarding email with temporary password & password change guide via Gmail SMTP.
                    </span>
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="h-10 px-4 rounded-full border border-[#F0DFC8] hover:bg-[#FAF0E4] text-xs font-bold text-[#735340] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 px-6 rounded-full bg-[#E8772E] hover:bg-[#D66820] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Creating Account...' : 'Create & Provision Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

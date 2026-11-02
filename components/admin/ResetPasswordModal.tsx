'use client';

import { useState } from 'react';
import { adminResetOwnerPasswordAction } from '@/app/actions/admin';
import { KeyRound, X, CheckCircle2, AlertCircle, Copy, Check, Sparkles } from 'lucide-react';

interface ResetPasswordModalProps {
  userId: string;
  ownerName: string;
  email: string;
}

export function ResetPasswordModal({ userId, ownerName, email }: ResetPasswordModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = 'Vulpi';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setError('');
    setSuccess(false);
    setCopied(false);
    generatePassword();
  };

  const handleClose = () => {
    setIsOpen(false);
    setSuccess(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    formData.set('user_id', userId);
    formData.set('owner_name', ownerName);
    formData.set('email', email);

    const res = await adminResetOwnerPasswordAction(formData);
    setIsSubmitting(false);

    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSuccess(true);
      setEmailSent(res.emailSent);
    }
  };

  const getCopyMessage = () => {
    const loginUrl = 'https://vulpi-zs31.vercel.app/login';
    return `🦊 Vulpi — Password Reset for ${ownerName}

Your login credentials have been updated:
• Login URL: ${loginUrl}
• Email: ${email}
• New Password: ${newPassword}

Steps to sign in and update:
1. Log in at ${loginUrl}
2. Go to "Settings" in your navigation.
3. Enter your own preferred password under "Change Password".`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCopyMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="px-2.5 py-1 rounded-lg border border-[#F0DFC8] hover:bg-[#FAF0E4] font-bold text-[11px] text-[#735340] hover:text-[#E8772E] flex items-center gap-1 cursor-pointer transition-colors"
        title="Reset owner password"
      >
        <KeyRound className="w-3 h-3" />
        <span>Reset Password</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#F0DFC8] shadow-2xl p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F0DFC8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF4E6] flex items-center justify-center text-[#E8772E]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#3B2216]">Reset Owner Password</h3>
                  <p className="text-[11px] text-[#735340]">{ownerName} ({email})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-7 h-7 rounded-full hover:bg-[#FAF0E4] flex items-center justify-center text-[#735340] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Password Reset Successfully!</p>
                    <p className="text-[11px] mt-0.5">
                      {emailSent
                        ? 'Email notification sent to owner via Gmail SMTP.'
                        : 'New password active. Copy details below to share directly with the owner.'}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#FFFBF5] rounded-xl border border-[#F0DFC8] text-xs font-mono space-y-1">
                  <p><strong>Email:</strong> {email}</p>
                  <p><strong>New Password:</strong> <span className="text-[#E8772E] font-bold">{newPassword}</span></p>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full h-10 rounded-xl bg-[#E8772E] hover:bg-[#D66820] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Credentials & Instructions</span>
                    </>
                  )}
                </button>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="h-9 px-4 rounded-full border border-[#F0DFC8] hover:bg-[#FAF0E4] text-xs font-bold text-[#3B2216] cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#735340]">
                      New Password
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
                    name="new_password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    className="w-full h-10 px-3 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] font-mono text-xs font-bold text-[#3B2216] focus:outline-none focus:ring-2 focus:ring-[#E8772E]/30"
                  />
                </div>

                <div className="p-3 bg-[#FFFBF5] rounded-xl border border-[#F0DFC8] flex items-start gap-2">
                  <input
                    type="checkbox"
                    id={`send_email_${userId}`}
                    name="send_email"
                    defaultChecked={true}
                    className="mt-0.5 rounded border-[#F0DFC8] text-[#E8772E] focus:ring-[#E8772E]"
                  />
                  <label htmlFor={`send_email_${userId}`} className="text-xs text-[#3B2216] cursor-pointer">
                    <span className="font-bold">Email new password to owner</span>
                    <span className="block text-[#735340] text-[11px]">
                      Sends an update notification via Gmail SMTP.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="h-9 px-4 rounded-full border border-[#F0DFC8] hover:bg-[#FAF0E4] text-xs font-bold text-[#735340] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-9 px-5 rounded-full bg-[#E8772E] hover:bg-[#D66820] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Updating...' : 'Set New Password'}
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

'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyInstructionsButtonProps {
  ownerName: string;
  email: string;
}

export function CopyInstructionsButton({ ownerName, email }: CopyInstructionsButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `🦊 Welcome to Vulpi — Cagayan de Oro Car Rental Marketplace!

Hello ${ownerName},

Here is how you can access your car owner portal and list your vehicles:
1. Open https://vulpi-zs31.vercel.app/login
2. Sign in with your registered email: ${email}
3. Once logged in, you can manage your fleet, view booking requests, and update your calendar.
4. To change your password, click "Settings" (or visit /owner/settings) and enter your new password under "Change Password".

Need help? Contact support at vulpi.cdo@gmail.com`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="px-2.5 py-1 rounded-lg border border-[#F0DFC8] hover:bg-[#FAF0E4] font-bold text-[11px] text-[#735340] hover:text-[#1AA3A3] flex items-center gap-1 cursor-pointer transition-colors"
      title="Copy sign-in steps to send to owner"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-emerald-600" />
          <span className="text-emerald-700">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>Copy Steps</span>
        </>
      )}
    </button>
  );
}

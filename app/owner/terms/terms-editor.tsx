'use client';

import { useState } from 'react';
import { updateOwnerTermsAction } from '@/app/actions/owner-terms';
import { STARTER_TERMS_TEMPLATE } from '@/lib/constants';
import { Save, RefreshCw, CheckCircle2 } from 'lucide-react';

export function TermsEditorClient({ initialTerms }: { initialTerms: string }) {
  const [terms, setTerms] = useState(initialTerms);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSavedSuccess(false);
    await updateOwnerTermsAction(terms);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetToTemplate = () => {
    if (confirm('Replace your current terms with the Vulpi CDO Starter Template?')) {
      setTerms(STARTER_TERMS_TEMPLATE);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#F0DFC8] shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0DFC8]/60">
        <span className="text-xs font-bold text-[#735340]">
          Standard 10-Point CDO Rental Agreement Text
        </span>
        <button
          type="button"
          onClick={handleResetToTemplate}
          className="text-xs font-bold text-[#1AA3A3] hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Load Vulpi Starter Template
        </button>
      </div>

      <textarea
        value={terms}
        onChange={(e) => setTerms(e.target.value)}
        rows={18}
        className="w-full p-4 rounded-2xl border border-[#F0DFC8] bg-[#FFFBF5] text-xs font-mono text-[#3B2216] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#E8772E]"
      />

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> Terms successfully updated!
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto h-12 px-8 rounded-full bg-[#E8772E] hover:bg-[#D4661E] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Terms'}
        </button>
      </div>
    </div>
  );
}

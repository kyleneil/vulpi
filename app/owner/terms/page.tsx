import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { STARTER_TERMS_TEMPLATE } from '@/lib/constants';
import { TermsEditorClient } from './terms-editor';
import { FileText } from 'lucide-react';

export default async function OwnerTermsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let initialTerms = STARTER_TERMS_TEMPLATE;

  const { data: owner } = await supabase
    .from('owners')
    .select('terms_text')
    .eq('user_id', user.id)
    .single();

  if ((owner as any)?.terms_text) {
    initialTerms = (owner as any).terms_text;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF4E6] flex items-center justify-center text-[#E8772E]">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#3B2216]">My Rental Terms & Conditions</h1>
          <p className="text-xs text-[#735340]">
            Renters must read and agree to these terms before submitting a booking request. These are also printed on your car rental agreement.
          </p>
        </div>
      </div>

      <TermsEditorClient initialTerms={initialTerms} />
    </div>
  );
}

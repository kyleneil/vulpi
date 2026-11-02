import { createClient } from '@/lib/supabase/server';
import { SettingsClient } from './settings-client';
import { redirect } from 'next/navigation';
import { isAdminEmail } from '@/lib/auth/admin';
import { Shield, KeyRound, User, Lock } from 'lucide-react';
import Link from 'next/link';

export default async function OwnerSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data } = await supabase
    .from('owners')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const owner = data || {
    name_or_business: user.user_metadata?.name || user.email?.split('@')[0] || 'Car Rental Partner',
    email: user.email,
    phone: '',
    pickup_location: 'Cagayan de Oro City',
    messenger_link: '',
    is_verified: false,
  };

  const isAdmin = isAdminEmail(user.email);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-[#3B2216]">Account & Security</h1>
        <p className="text-xs text-[#735340] mt-1">
          Manage your owner business profile and update your sign-in password.
        </p>
      </div>

      <SettingsClient owner={owner} userEmail={user.email || owner.email} isAdmin={isAdmin} />
    </div>
  );
}

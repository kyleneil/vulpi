import { createClient } from '@/lib/supabase/server';
import { SettingsClient } from './settings-client';
import { redirect } from 'next/navigation';
import { Shield, KeyRound, User, Lock } from 'lucide-react';
import Link from 'next/link';

export default async function OwnerSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let owner: any = null;

  if (user) {
    const { data } = await supabase
      .from('owners')
      .select('*')
      .eq('user_id', user.id)
      .single();
    owner = data;
  }

  // Fallback defaults if in demo preview
  if (!owner) {
    owner = {
      name_or_business: 'Vulpi CDO Fleet Admin',
      email: user?.email || 'admin@vulpi.ph',
      phone: '+63 917 123 4567',
      pickup_location: 'SM City Uptown / Pueblo de Oro, Cagayan de Oro City',
      messenger_link: 'https://m.me/vulpi.ph',
      is_verified: true,
    };
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-[#3B2216]">Account & Security</h1>
        <p className="text-xs text-[#735340] mt-1">
          Manage your owner business profile and update your sign-in password.
        </p>
      </div>

      <SettingsClient owner={owner} userEmail={user?.email || owner.email} />
    </div>
  );
}

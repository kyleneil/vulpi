'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateOwnerTermsAction(termsText: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in as an owner.' };
  }

  const { error } = await (supabase.from('owners') as any)
    .update({ terms_text: termsText })
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/owner/terms');
  return { success: true };
}

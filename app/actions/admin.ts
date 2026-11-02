'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function toggleOwnerVerificationAction(ownerId: string, currentStatus: boolean) {
  const supabase = createAdminClient();
  const { error } = await (supabase.from('owners') as any)
    .update({ is_verified: !currentStatus })
    .eq('id', ownerId);

  if (error) return { error: error.message };
  revalidatePath('/admin');
  return { success: true };
}

export async function adminToggleCarActiveAction(carId: string, currentStatus: boolean) {
  const supabase = createAdminClient();
  const { error } = await (supabase.from('cars') as any)
    .update({ is_active: !currentStatus })
    .eq('id', carId);

  if (error) return { error: error.message };
  revalidatePath('/admin');
  revalidatePath('/cars');
  return { success: true };
}

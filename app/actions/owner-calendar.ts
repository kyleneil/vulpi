'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { BlockReason } from '@/types/database';

export async function addBlockedDateAction(
  carId: string,
  startDate: string,
  endDate: string,
  reason: BlockReason
) {
  const supabase = await createClient();

  if (new Date(startDate) > new Date(endDate)) {
    return { error: 'Start date cannot be after end date.' };
  }

  const { data, error } = await (supabase.from('blocked_dates') as any)
    .insert({
      car_id: carId,
      start_date: startDate,
      end_date: endDate,
      reason,
    })
    .select('id')
    .single();

  if (error) {
    if (error.message.includes('overlapping') || error.code === '23P01') {
      return { error: 'These dates overlap with an existing block or booking on this car.' };
    }
    return { error: error.message };
  }

  revalidatePath(`/owner/cars/${carId}/calendar`);
  revalidatePath(`/cars/${carId}`);
  return { success: true, blockId: (data as any)?.id };
}

export async function removeBlockedDateAction(blockedDateId: string, carId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('blocked_dates')
    .delete()
    .eq('id', blockedDateId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/owner/cars/${carId}/calendar`);
  revalidatePath(`/cars/${carId}`);
  return { success: true };
}

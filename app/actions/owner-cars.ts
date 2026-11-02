'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { CarType, TransmissionType, FuelType } from '@/types/database';

export async function createCarAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in as an owner to list a car.' };
  }

  // Get owner record
  const { data: owner } = await supabase
    .from('owners')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!owner) {
    return { error: 'Owner profile not found. Please complete your registration.' };
  }

  const typedOwner = owner as any;
  const make = formData.get('make') as string;
  const model = formData.get('model') as string;
  const year = parseInt(formData.get('year') as string, 10);
  const plate_number = (formData.get('plate_number') as string) || null;
  const car_type = formData.get('car_type') as CarType;
  const transmission = formData.get('transmission') as TransmissionType;
  const seats = parseInt(formData.get('seats') as string, 10);
  const fuel_type = (formData.get('fuel_type') as FuelType) || 'gasoline';
  const daily_rate_in_city = parseFloat(formData.get('daily_rate_in_city') as string);
  const daily_rate_out_of_city_str = formData.get('daily_rate_out_of_city') as string;
  const daily_rate_out_of_city = daily_rate_out_of_city_str ? parseFloat(daily_rate_out_of_city_str) : null;
  const driver_available = formData.get('driver_available') === 'true';
  const driver_fee_str = formData.get('driver_fee') as string;
  const driver_fee = driver_fee_str ? parseFloat(driver_fee_str) : null;
  const security_deposit_str = formData.get('security_deposit') as string;
  const security_deposit = security_deposit_str ? parseFloat(security_deposit_str) : null;
  const notes = (formData.get('notes') as string) || null;
  const photosJson = formData.get('photos') as string;
  const photos = photosJson ? JSON.parse(photosJson) : [];

  const { data, error } = await (supabase.from('cars') as any).insert({
    owner_id: typedOwner.id,
    make,
    model,
    year,
    plate_number,
    car_type,
    transmission,
    seats,
    fuel_type,
    photos,
    daily_rate_in_city,
    daily_rate_out_of_city,
    driver_available,
    driver_fee,
    security_deposit,
    notes,
    is_active: true,
  }).select('id').single();

  if (error) {
    console.error('[createCarAction error]', error);
    return { error: error.message };
  }

  revalidatePath('/owner/cars');
  revalidatePath('/cars');
  return { success: true, carId: (data as any)?.id };
}

export async function updateCarAction(carId: string, formData: FormData) {
  const supabase = await createClient();

  const make = formData.get('make') as string;
  const model = formData.get('model') as string;
  const year = parseInt(formData.get('year') as string, 10);
  const plate_number = (formData.get('plate_number') as string) || null;
  const car_type = formData.get('car_type') as CarType;
  const transmission = formData.get('transmission') as TransmissionType;
  const seats = parseInt(formData.get('seats') as string, 10);
  const fuel_type = (formData.get('fuel_type') as FuelType) || 'gasoline';
  const daily_rate_in_city = parseFloat(formData.get('daily_rate_in_city') as string);
  const daily_rate_out_of_city_str = formData.get('daily_rate_out_of_city') as string;
  const daily_rate_out_of_city = daily_rate_out_of_city_str ? parseFloat(daily_rate_out_of_city_str) : null;
  const driver_available = formData.get('driver_available') === 'true';
  const driver_fee_str = formData.get('driver_fee') as string;
  const driver_fee = driver_fee_str ? parseFloat(driver_fee_str) : null;
  const security_deposit_str = formData.get('security_deposit') as string;
  const security_deposit = security_deposit_str ? parseFloat(security_deposit_str) : null;
  const notes = (formData.get('notes') as string) || null;
  const photosJson = formData.get('photos') as string;
  const photos = photosJson ? JSON.parse(photosJson) : undefined;

  const updatePayload: Record<string, unknown> = {
    make,
    model,
    year,
    plate_number,
    car_type,
    transmission,
    seats,
    fuel_type,
    daily_rate_in_city,
    daily_rate_out_of_city,
    driver_available,
    driver_fee,
    security_deposit,
    notes,
  };

  if (photos) {
    updatePayload.photos = photos;
  }

  const { error } = await (supabase.from('cars') as any)
    .update(updatePayload)
    .eq('id', carId);

  if (error) {
    console.error('[updateCarAction error]', error);
    return { error: error.message };
  }

  revalidatePath('/owner/cars');
  revalidatePath(`/owner/cars/${carId}`);
  revalidatePath(`/cars/${carId}`);
  return { success: true };
}

export async function toggleCarActiveAction(carId: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await (supabase.from('cars') as any)
    .update({ is_active: isActive })
    .eq('id', carId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/owner/cars');
  revalidatePath('/cars');
  return { success: true };
}

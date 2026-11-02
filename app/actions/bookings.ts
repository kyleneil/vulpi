'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkCarAvailability } from '@/lib/availability/query';
import { calculateRentalDays } from '@/lib/formatters';
import { notificationService } from '@/lib/notifications/service';
import { revalidatePath } from 'next/cache';
import { DestinationType, BookingStatus } from '@/types/database';
import { addHours } from 'date-fns';

export async function createBookingRequestAction(formData: FormData) {
  const carId = formData.get('car_id') as string;
  const renterName = formData.get('renter_name') as string;
  const renterPhone = formData.get('renter_phone') as string;
  const renterEmail = (formData.get('renter_email') as string) || null;
  const startDate = formData.get('start_date') as string;
  const endDate = formData.get('end_date') as string;
  const destinationType = formData.get('destination_type') as DestinationType;
  const destinationDetails = (formData.get('destination_details') as string) || null;
  const withDriver = formData.get('with_driver') === 'true';
  const termsAccepted = formData.get('terms_accepted') === 'true';

  if (!termsAccepted) {
    return { error: 'You must read and agree to the owner’s rental terms and conditions.' };
  }

  if (!carId || !renterName || !renterPhone || !startDate || !endDate || !destinationType) {
    return { error: 'Please fill in all required fields.' };
  }

  // 1. Double check availability in server action
  const { isAvailable } = await checkCarAvailability(carId, startDate, endDate);
  if (!isAvailable) {
    return {
      error: 'Sorry, those dates were just taken. Please choose another car or dates.',
      isConflict: true,
    };
  }

  const supabase = await createClient();

  // 2. Fetch car & owner details for pricing and notification
  const { data: car, error: carErr } = await supabase
    .from('cars')
    .select('*, owner:owners(*)')
    .eq('id', carId)
    .single();

  if (carErr || !car) {
    return { error: 'Car not found.' };
  }

  const typedCar = car as any;

  // 3. Compute estimated total: daily rate x days (+ driver fee if applicable)
  const days = calculateRentalDays(startDate, endDate);
  const dailyRate = destinationType === 'outside_cdo' && typedCar.daily_rate_out_of_city
    ? typedCar.daily_rate_out_of_city
    : typedCar.daily_rate_in_city;

  const driverRate = withDriver && typedCar.driver_fee ? typedCar.driver_fee : 0;
  const estimatedTotal = (dailyRate + driverRate) * days;

  // 4. Handle optional license photo upload
  let licensePhotoPath: string | null = null;
  const licenseFile = formData.get('license_photo') as File | null;
  if (licenseFile && licenseFile.size > 0) {
    try {
      const adminClient = createAdminClient();
      const fileExt = licenseFile.name.split('.').pop() || 'jpg';
      const fileName = `${carId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadErr } = await adminClient.storage
        .from('licenses')
        .upload(fileName, licenseFile, {
          contentType: licenseFile.type,
          upsert: false,
        });

      if (!uploadErr && uploadData) {
        licensePhotoPath = uploadData.path;
      }
    } catch (uploadError) {
      console.warn('License upload skipped:', uploadError);
    }
  }

  // 5. 24-hour hold expiration
  const holdHours = parseInt(process.env.BOOKING_HOLD_HOURS || '24', 10);
  const holdExpiresAt = addHours(new Date(), holdHours).toISOString();

  // 6. Insert booking request into DB (DB exclusion constraint ensures race-condition safety)
  const { data: newBooking, error: insertErr } = await (supabase.from('bookings') as any)
    .insert({
      car_id: carId,
      renter_name: renterName,
      renter_phone: renterPhone,
      renter_email: renterEmail,
      start_date: startDate,
      end_date: endDate,
      destination_type: destinationType,
      destination_details: destinationDetails,
      with_driver: withDriver,
      estimated_total: estimatedTotal,
      status: 'pending',
      hold_expires_at: holdExpiresAt,
      license_photo_path: licensePhotoPath,
      terms_accepted_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertErr) {
    if (insertErr.message.includes('overlapping') || insertErr.code === '23P01') {
      return {
        error: 'Sorry, those dates were just taken! Another renter requested them first.',
        isConflict: true,
      };
    }
    return { error: insertErr.message };
  }

  // 7. Dispatch notification to the owner
  const owner = typedCar.owner;
  if (owner) {
    await notificationService.notifyNewBooking({
      bookingId: (newBooking as any)?.id,
      carMake: typedCar.make,
      carModel: typedCar.model,
      carYear: typedCar.year,
      renterName,
      renterPhone,
      renterEmail,
      startDate,
      endDate,
      destination: destinationType,
      estimatedTotal,
      ownerName: owner.name_or_business,
      ownerEmail: owner.email,
      ownerPhone: owner.phone,
      holdExpiresAt,
    });
  }

  revalidatePath('/owner/requests');
  revalidatePath(`/cars/${carId}`);
  return { success: true, bookingId: (newBooking as any)?.id };
}

export async function updateBookingStatusAction(
  bookingId: string,
  newStatus: BookingStatus,
  ownerNote?: string
) {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    status: newStatus,
  };

  if (ownerNote !== undefined) {
    updateData.owner_note = ownerNote;
  }

  const { data: booking, error } = await (supabase.from('bookings') as any)
    .update(updateData)
    .eq('id', bookingId)
    .select('*, car:cars(*, owner:owners(*))')
    .single();

  if (error) {
    return { error: error.message };
  }

  // Trigger status update notifications (Telegram alert and email to renter)
  if (booking && (newStatus === 'confirmed' || newStatus === 'declined' || newStatus === 'cancelled')) {
    const typedBooking = booking as any;
    const car = typedBooking.car;
    const owner = car?.owner;

    if (car && owner) {
      await notificationService.notifyStatusUpdate({
        bookingId,
        carMake: car.make,
        carModel: car.model,
        renterName: typedBooking.renter_name,
        renterEmail: typedBooking.renter_email,
        renterPhone: typedBooking.renter_phone,
        status: newStatus as any,
        ownerName: owner.name_or_business,
        ownerPhone: owner.phone,
        ownerNote,
        pickupLocation: owner.pickup_location,
      });
    }
  }

  revalidatePath('/owner/requests');
  revalidatePath(`/owner/requests/${bookingId}`);
  return { success: true };
}

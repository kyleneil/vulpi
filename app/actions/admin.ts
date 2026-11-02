'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { STARTER_TERMS_TEMPLATE } from '@/lib/constants';
import { sendOwnerCredentialsEmail, sendOwnerPasswordResetEmail, isSmtpConfigured } from '@/lib/notifications/providers/smtp';

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

/**
 * Provision a new Car Owner account directly from Admin Dashboard.
 * Creates the auth user in Supabase Auth, adds the public.owners profile,
 * and optionally dispatches an onboarding email with credentials & password change instructions.
 */
export async function provisionOwnerAction(formData: FormData) {
  const nameOrBusiness = (formData.get('name_or_business') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const phone = (formData.get('phone') as string)?.trim();
  const pickupLocation = (formData.get('pickup_location') as string)?.trim() || 'Cagayan de Oro City';
  const messengerLink = (formData.get('messenger_link') as string)?.trim() || null;
  const password = (formData.get('password') as string)?.trim();
  const sendEmail = formData.get('send_email') === 'true' || formData.get('send_email') === 'on';

  if (!nameOrBusiness || !email || !phone || !password) {
    return { error: 'Please provide Name/Business, Email, Phone, and Password.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  const supabase = createAdminClient();

  // 1. Check if owner already exists
  const { data: existingOwner } = await supabase
    .from('owners')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  if (existingOwner) {
    return { error: `An owner with email "${email}" already exists in the system.` };
  }

  // 2. Create user in Supabase Auth via admin API
  let userId: string;
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name_or_business: nameOrBusiness,
      phone,
    },
  });

  if (authErr) {
    // If the user already existed in auth, look up their ID
    if (authErr.message && authErr.message.toLowerCase().includes('already registered')) {
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existingUser = listData?.users?.find((u) => u.email?.toLowerCase() === email);
      if (existingUser) {
        userId = existingUser.id;
        // Update password to the new one specified
        await supabase.auth.admin.updateUserById(userId, { password });
      } else {
        return { error: authErr.message };
      }
    } else {
      return { error: `Auth Error: ${authErr.message}` };
    }
  } else {
    userId = authData.user.id;
  }

  // 3. Insert record into public.owners
  const { error: ownerErr } = await (supabase.from('owners') as any).insert({
    user_id: userId,
    name_or_business: nameOrBusiness,
    phone,
    email,
    messenger_link: messengerLink,
    pickup_location: pickupLocation,
    terms_text: STARTER_TERMS_TEMPLATE,
    is_verified: true,
  });

  if (ownerErr) {
    return { error: `Database Error: ${ownerErr.message}` };
  }

  // 4. Optionally send onboarding email with login credentials
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vulpi-zs31.vercel.app';
  const loginUrl = `${appUrl}/login`;
  let emailSent = false;

  if (sendEmail && isSmtpConfigured()) {
    const res = await sendOwnerCredentialsEmail({
      ownerName: nameOrBusiness,
      email,
      temporaryPassword: password,
      loginUrl,
    });
    emailSent = res.success;
  }

  revalidatePath('/admin');

  return {
    success: true,
    emailSent,
    credentials: {
      name: nameOrBusiness,
      email,
      password,
      loginUrl,
    },
  };
}

/**
 * Reset password for a car owner by admin.
 */
export async function adminResetOwnerPasswordAction(formData: FormData) {
  const userId = formData.get('user_id') as string;
  const ownerName = formData.get('owner_name') as string;
  const email = (formData.get('email') as string)?.toLowerCase().trim();
  const newPassword = (formData.get('new_password') as string)?.trim();
  const sendEmail = formData.get('send_email') === 'true' || formData.get('send_email') === 'on';

  if (!userId || !newPassword || newPassword.length < 6) {
    return { error: 'Please provide a valid password of at least 6 characters.' };
  }

  const supabase = createAdminClient();

  const { error: resetErr } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (resetErr) {
    return { error: resetErr.message };
  }

  let emailSent = false;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vulpi-zs31.vercel.app';
  const loginUrl = `${appUrl}/login`;

  if (sendEmail && email && isSmtpConfigured()) {
    const res = await sendOwnerPasswordResetEmail({
      ownerName: ownerName || 'Car Rental Partner',
      email,
      newPassword,
      loginUrl,
    });
    emailSent = res.success;
  }

  return {
    success: true,
    emailSent,
    credentials: {
      email,
      newPassword,
      loginUrl,
    },
  };
}

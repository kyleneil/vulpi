'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { STARTER_TERMS_TEMPLATE } from '@/lib/constants';

export async function loginAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = (formData.get('password') as string)?.trim();
  let redirectTo = (formData.get('redirect') as string);

  // If logging in as admin or from the footer admin login, route to /admin
  if (!redirectTo || redirectTo === '/owner/dashboard') {
    if (email === 'admin@vulpi.ph' || email.includes('admin')) {
      redirectTo = '/admin';
    } else {
      redirectTo = '/owner/dashboard';
    }
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(redirectTo);
}

export async function signupAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const nameOrBusiness = formData.get('name_or_business') as string;
  const phone = formData.get('phone') as string;
  const pickupLocation = formData.get('pickup_location') as string;
  const messengerLink = (formData.get('messenger_link') as string) || null;

  const supabase = await createClient();

  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name_or_business: nameOrBusiness,
        phone,
      },
    },
  });

  if (authErr || !authData.user) {
    return { error: authErr?.message || 'Could not register user.' };
  }

  // Create owner record
  const { error: ownerErr } = await (supabase.from('owners') as any).insert({
    user_id: authData.user.id,
    name_or_business: nameOrBusiness,
    phone,
    email,
    messenger_link: messengerLink,
    pickup_location: pickupLocation,
    terms_text: STARTER_TERMS_TEMPLATE,
    is_verified: false,
  });

  if (ownerErr) {
    console.error('Owner profile creation error:', ownerErr);
  }

  redirect('/owner/dashboard');
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function updatePasswordAction(formData: FormData) {
  const newPassword = formData.get('new_password') as string;
  const confirmPassword = formData.get('confirm_password') as string;

  if (!newPassword || newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }
  if (newPassword !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: error.message };
  }

  return { success: 'Your password has been successfully updated!' };
}

export async function updateOwnerProfileAction(formData: FormData) {
  const nameOrBusiness = formData.get('name_or_business') as string;
  const phone = formData.get('phone') as string;
  const pickupLocation = formData.get('pickup_location') as string;
  const messengerLink = formData.get('messenger_link') as string;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be signed in to update your profile.' };
  }

  // Check if owner profile exists, if not insert, else update
  const { data: existingOwner } = await supabase
    .from('owners')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (existingOwner) {
    const { error } = await (supabase.from('owners') as any)
      .update({
        name_or_business: nameOrBusiness,
        phone,
        pickup_location: pickupLocation,
        messenger_link: messengerLink || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await (supabase.from('owners') as any).insert({
      user_id: user.id,
      name_or_business: nameOrBusiness,
      phone,
      email: user.email || '',
      pickup_location: pickupLocation,
      messenger_link: messengerLink || null,
      is_verified: false,
    });

    if (error) {
      return { error: error.message };
    }
  }

  return { success: 'Profile details saved successfully!' };
}

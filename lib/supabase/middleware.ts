import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwnerRoute = request.nextUrl.pathname.startsWith('/owner');
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

  // 1. Strict Authentication Guard: Unauthenticated users cannot access owner or admin areas
  if (!user && (isOwnerRoute || isAdminRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    if (isAdminRoute) {
      url.searchParams.set('admin', 'true');
    }
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // 2. Strict Role Guard: Only verified admin email can access /admin
  if (user && isAdminRoute) {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@vulpi.ph').toLowerCase().trim();
    const userEmail = (user.email || '').toLowerCase().trim();
    if (userEmail !== adminEmail) {
      const url = request.nextUrl.clone();
      url.pathname = '/owner/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isAdminEmail } from '@/lib/auth/admin';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const isOwnerRoute = request.nextUrl.pathname.startsWith('/owner');
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

    // 1. Fast path for public routes: Avoid session calls and network overhead on public browse pages
    if (!isOwnerRoute && !isAdminRoute) {
      return supabaseResponse;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

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

    // 2. Strict Authentication Guard: Unauthenticated users cannot access owner or admin areas
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      if (isAdminRoute) {
        url.searchParams.set('admin', 'true');
      }
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // 3. Strict Role Guard: Only verified admin email can access /admin
    if (isAdminRoute) {
      if (!isAdminEmail(user.email)) {
        const url = request.nextUrl.clone();
        url.pathname = '/owner/dashboard';
        return NextResponse.redirect(url);
      }
    }
  } catch (error) {
    console.error('[Middleware Error]', error);
  }

  return supabaseResponse;
}

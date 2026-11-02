import { NextRequest, NextResponse } from 'next/server';
import { getPresignedViewUrl, isR2Configured } from '@/lib/storage/r2';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Missing document key' }, { status: 400 });
  }

  // Verify caller is an authenticated owner or admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // If Cloudflare R2 is configured, generate a short-lived 60-second presigned URL
  if (isR2Configured()) {
    const viewUrl = await getPresignedViewUrl(key, 60);
    if (!viewUrl) {
      return NextResponse.json({ error: 'Failed to generate secure URL' }, { status: 500 });
    }
    return NextResponse.redirect(viewUrl);
  }

  // Fallback to Supabase private storage signed URL
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.storage
      .from('licenses')
      .createSignedUrl(key, 60);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Storage error' }, { status: 500 });
  }
}

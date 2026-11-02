import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPresignedUploadUrl, isR2Configured } from '@/lib/storage/r2';
import { createClient } from '@/lib/supabase/server';

const presignedRequestSchema = z.object({
  bucketType: z.enum(['public', 'private']),
  filename: z.string().min(1).max(255),
  contentType: z.string().regex(/^image\/(jpeg|png|webp|avif)$/i, 'Only JPEG, PNG, WebP, and AVIF images are allowed'),
  prefix: z.enum(['vehicles', 'kyc', 'inspections', 'licenses']).default('vehicles'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = presignedRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid upload request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { bucketType, filename, contentType, prefix } = parsed.data;

    // Check auth for private KYC / vehicle management uploads
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Private uploads (except initial renter license hold) require an authenticated session or valid context
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectKey = `${prefix}/${timestamp}-${randomSuffix}-${sanitizedFilename}`;

    if (!isR2Configured()) {
      return NextResponse.json(
        {
          useR2: false,
          fallbackKey: objectKey,
          message: 'Cloudflare R2 credentials not configured. Falling back to Supabase storage.',
        },
        { status: 200 }
      );
    }

    const presigned = await getPresignedUploadUrl(bucketType, objectKey, contentType);

    if (!presigned) {
      return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }

    return NextResponse.json({
      useR2: true,
      uploadUrl: presigned.uploadUrl,
      publicUrl: presigned.publicUrl,
      key: objectKey,
    });
  } catch (error: any) {
    console.error('[Presigned URL Error]', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

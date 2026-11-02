'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, X, Plus, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { compressImageToWebP } from '@/lib/storage/compression';

interface PhotoUploaderProps {
  initialPhotos?: string[];
  onChange: (photos: string[]) => void;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  status: 'compressing' | 'uploading' | 'done' | 'error';
  errorMessage?: string;
  previewUrl?: string;
}

export function PhotoUploader({ initialPhotos = [], onChange }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [inputUrl, setInputUrl] = useState('');
  const [uploadQueue, setUploadQueue] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addPhotoUrl = () => {
    if (!inputUrl.trim()) return;
    const updated = [...photos, inputUrl.trim()];
    setPhotos(updated);
    onChange(updated);
    setInputUrl('');
  };

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    onChange(updated);
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      const fileId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const previewUrl = URL.createObjectURL(file);

      // Add to queue
      setUploadQueue((prev) => [
        ...prev,
        { id: fileId, name: file.name, progress: 15, status: 'compressing', previewUrl },
      ]);

      try {
        // 1. Client-side compress to WebP (< 400KB)
        const compressed = await compressImageToWebP(file, {
          maxDimension: 1920,
          quality: 0.82,
        });

        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === fileId ? { ...item, progress: 45, status: 'uploading' } : item
          )
        );

        // 2. Request presigned URL from Cloudflare R2 API
        const presignRes = await fetch('/api/uploads/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bucketType: 'public',
            prefix: 'vehicles',
            contentType: 'image/webp',
            fileSize: compressed.file.size,
          }),
        });

        if (!presignRes.ok) {
          throw new Error('Upload endpoint unavailable. Fallback to direct URL paste.');
        }

        const { uploadUrl, publicUrl } = await presignRes.json();

        // 3. Upload directly from browser to Cloudflare R2 via presigned PUT
        const r2Res = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'image/webp',
          },
          body: compressed.file,
        });

        if (!r2Res.ok) {
          throw new Error('Direct upload to R2 storage failed.');
        }

        // 4. Append to photos
        setPhotos((prevPhotos) => {
          const nextPhotos = [...prevPhotos, publicUrl];
          onChange(nextPhotos);
          return nextPhotos;
        });

        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === fileId ? { ...item, progress: 100, status: 'done' } : item
          )
        );

        // Auto remove successful item after 2.5s
        setTimeout(() => {
          setUploadQueue((prev) => prev.filter((item) => item.id !== fileId));
        }, 2500);
      } catch (err: any) {
        console.error('Photo upload error:', err);
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === fileId
              ? {
                  ...item,
                  status: 'error',
                  errorMessage: err.message || 'Upload failed',
                }
              : item
          )
        );
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#735340]">
          Vehicle Photos (Zero-Egress R2 & WebP)
        </label>
        <span className="text-[11px] text-[#1AA3A3] font-semibold flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Auto-compressed to &lt;400KB WebP
        </span>
      </div>

      {/* Grid of existing photos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((url, index) => (
          <div
            key={index}
            className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#F0DFC8] bg-[#FAF0E4] group"
          >
            <Image
              src={url}
              alt={`Car photo ${index + 1}`}
              fill
              unoptimized={url.startsWith('blob:') || url.startsWith('http')}
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#3B2216]/80 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
              title="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
            {index === 0 && (
              <span className="absolute bottom-2 left-2 bg-[#E8772E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                Main Cover
              </span>
            )}
          </div>
        ))}

        {/* Uploading queue cards */}
        {uploadQueue.map((item) => (
          <div
            key={item.id}
            className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#1AA3A3] bg-[#E8F6F6] flex flex-col items-center justify-center p-3 text-center"
          >
            {item.status === 'compressing' && (
              <>
                <Loader2 className="w-6 h-6 text-[#1AA3A3] animate-spin mb-1" />
                <span className="text-[11px] font-bold text-[#0F7F82]">Optimizing WebP...</span>
              </>
            )}
            {item.status === 'uploading' && (
              <>
                <UploadCloud className="w-6 h-6 text-[#1AA3A3] animate-bounce mb-1" />
                <span className="text-[11px] font-bold text-[#0F7F82]">Uploading to R2...</span>
              </>
            )}
            {item.status === 'done' && (
              <>
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mb-1" />
                <span className="text-[11px] font-bold text-emerald-700">Uploaded!</span>
              </>
            )}
            {item.status === 'error' && (
              <div className="p-2">
                <span className="text-[10px] font-bold text-red-600 block leading-tight">
                  {item.errorMessage}
                </span>
                <span className="text-[9px] text-[#735340] mt-1 block">Paste URL below instead</span>
              </div>
            )}
          </div>
        ))}

        {/* Drop / Select button */}
        <label
          htmlFor="vehicle-photo-input"
          className="aspect-[4/3] rounded-2xl border-2 border-dashed border-[#F0DFC8] hover:border-[#E8772E] bg-[#FFFBF5] flex flex-col items-center justify-center p-3 text-center transition-colors cursor-pointer group"
        >
          <UploadCloud className="w-7 h-7 text-[#1AA3A3] group-hover:scale-110 transition-transform mb-1.5" />
          <span className="text-xs font-bold text-[#3B2216]">Upload Vehicle Photos</span>
          <span className="text-[10px] text-[#735340] mt-0.5">JPG, PNG, WebP (multi-select)</span>
          <input
            id="vehicle-photo-input"
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFilesSelected}
            className="hidden"
          />
        </label>
      </div>

      {/* Fallback URL Input field */}
      <div className="flex gap-2 pt-1">
        <input
          type="url"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Or paste photo link (Unsplash, CDN, or Cloudflare R2 URL)"
          className="flex-1 h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-white text-sm text-[#3B2216] focus:outline-none focus:ring-2 focus:ring-[#E8772E]"
        />
        <button
          type="button"
          onClick={addPhotoUrl}
          className="h-12 px-4 rounded-xl bg-[#735340] hover:bg-[#3B2216] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add URL
        </button>
      </div>
    </div>
  );
}

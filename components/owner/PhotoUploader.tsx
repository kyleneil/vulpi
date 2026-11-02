'use client';

import { useState } from 'react';
import Image from 'next/image';
import { UploadCloud, X, Plus } from 'lucide-react';

interface PhotoUploaderProps {
  initialPhotos?: string[];
  onChange: (photos: string[]) => void;
}

export function PhotoUploader({ initialPhotos = [], onChange }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [inputUrl, setInputUrl] = useState('');

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

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold uppercase tracking-wider text-[#735340]">
        Vehicle Photos (Multi-photo)
      </label>

      {/* Grid of existing photos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((url, index) => (
          <div key={index} className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#F0DFC8] bg-[#FAF0E4] group">
            <Image
              src={url}
              alt={`Car photo ${index + 1}`}
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#3B2216]/80 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            {index === 0 && (
              <span className="absolute bottom-2 left-2 bg-[#E8772E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Main Cover
              </span>
            )}
          </div>
        ))}

        {/* Add photo card */}
        <div className="aspect-[4/3] rounded-2xl border-2 border-dashed border-[#F0DFC8] hover:border-[#E8772E] bg-[#FFFBF5] flex flex-col items-center justify-center p-3 text-center transition-colors">
          <UploadCloud className="w-6 h-6 text-[#1AA3A3] mb-1.5" />
          <span className="text-xs font-medium text-[#735340]">Paste photo URL below</span>
        </div>
      </div>

      {/* URL Input field */}
      <div className="flex gap-2">
        <input
          type="url"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="https://... photo link (Unsplash or direct image URL)"
          className="flex-1 h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-white text-sm text-[#3B2216] focus:outline-none focus:ring-2 focus:ring-[#E8772E]"
        />
        <button
          type="button"
          onClick={addPhotoUrl}
          className="h-12 px-4 rounded-xl bg-[#1AA3A3] hover:bg-[#0F7F82] text-white font-bold text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Photo
        </button>
      </div>
    </div>
  );
}

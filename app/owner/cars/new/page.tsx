'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCarAction } from '@/app/actions/owner-cars';
import { PhotoUploader } from '@/components/owner/PhotoUploader';
import { CAR_TYPES } from '@/lib/constants';
import { Car, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function NewCarPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>([]);
  const [driverAvailable, setDriverAvailable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    formData.set('photos', JSON.stringify(photos));
    formData.set('driver_available', String(driverAvailable));

    const res = await createCarAction(formData);
    setIsSubmitting(false);

    if (res?.error) {
      setErrorMessage(res.error);
    } else {
      router.push('/owner/cars');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/owner/cars"
          className="w-10 h-10 rounded-full bg-white border border-[#F0DFC8] flex items-center justify-center text-[#735340] hover:bg-[#FAF0E4] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#3B2216]">List a New Car</h1>
          <p className="text-xs text-[#735340]">Add your vehicle to Vulpi marketplace in Cagayan de Oro.</p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 border border-[#F0DFC8] shadow-sm space-y-6">
        {/* Photo Uploader */}
        <PhotoUploader initialPhotos={photos} onChange={setPhotos} />

        {/* Vehicle Basics */}
        <div className="space-y-4 pt-4 border-t border-[#F0DFC8]/60">
          <h3 className="font-bold text-base text-[#3B2216] flex items-center gap-2">
            <Car className="w-4 h-4 text-[#E8772E]" /> Vehicle Specifications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">Make</label>
              <input
                type="text"
                name="make"
                required
                placeholder="e.g. Toyota"
                className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216] focus:ring-2 focus:ring-[#E8772E]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">Model</label>
              <input
                type="text"
                name="model"
                required
                placeholder="e.g. Vios 1.3 XLE"
                className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216] focus:ring-2 focus:ring-[#E8772E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">Year</label>
              <input
                type="number"
                name="year"
                required
                min={2000}
                max={2030}
                defaultValue={2023}
                className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">Seats</label>
              <input
                type="number"
                name="seats"
                required
                min={2}
                max={20}
                defaultValue={5}
                className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">Car Type</label>
              <select
                name="car_type"
                required
                className="w-full h-12 px-3 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
              >
                {CAR_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">Transmission</label>
              <select
                name="transmission"
                required
                className="w-full h-12 px-3 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
              >
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">Fuel Type</label>
              <select
                name="fuel_type"
                className="w-full h-12 px-3 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
              >
                <option value="gasoline">Gasoline</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">Plate Number (Optional)</label>
              <input
                type="text"
                name="plate_number"
                placeholder="e.g. KAA 1234 (shown on agreement)"
                className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4 pt-4 border-t border-[#F0DFC8]/60">
          <h3 className="font-bold text-base text-[#3B2216]">Rental Rates & Deposit (PHP ₱)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
                Daily Rate (In-City CDO) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-sm font-bold text-[#735340]">₱</span>
                <input
                  type="number"
                  name="daily_rate_in_city"
                  required
                  step="50"
                  min="500"
                  placeholder="1600"
                  className="w-full h-12 pl-8 pr-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm font-bold text-[#E8772E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
                Daily Rate (Outside CDO)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-sm font-bold text-[#735340]">₱</span>
                <input
                  type="number"
                  name="daily_rate_out_of_city"
                  step="50"
                  placeholder="Leave empty for 'Rate on request'"
                  className="w-full h-12 pl-8 pr-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm font-bold text-[#3B2216]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
                Security Deposit
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-sm font-bold text-[#735340]">₱</span>
                <input
                  type="number"
                  name="security_deposit"
                  step="100"
                  placeholder="2000"
                  className="w-full h-12 pl-8 pr-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
                />
              </div>
            </div>
          </div>

          {/* Driver option toggle */}
          <div className="bg-[#FFFBF5] p-4 rounded-2xl border border-[#F0DFC8] space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={driverAvailable}
                onChange={(e) => setDriverAvailable(e.target.checked)}
                className="w-5 h-5 rounded text-[#E8772E] accent-[#E8772E] cursor-pointer"
              />
              <span className="text-sm font-bold text-[#3B2216]">
                Offer optional professional driver service with this car
              </span>
            </label>

            {driverAvailable && (
              <div className="pl-8 pt-1 max-w-xs">
                <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
                  Driver Fee per Day (PHP ₱)
                </label>
                <input
                  type="number"
                  name="driver_fee"
                  step="50"
                  placeholder="e.g. 800"
                  className="w-full h-11 px-3.5 rounded-xl border border-[#F0DFC8] bg-white text-sm font-bold text-[#1AA3A3]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2 pt-4 border-t border-[#F0DFC8]/60">
          <label className="block text-xs font-bold uppercase text-[#735340]">
            Listing Notes / Special Instructions
          </label>
          <textarea
            name="notes"
            rows={3}
            placeholder="e.g. Free airport pickup upon request. Perfect for trips to Bukidnon."
            className="w-full p-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
          />
        </div>

        {/* Actions */}
        <div className="pt-4 flex gap-3">
          <Link
            href="/owner/cars"
            className="flex-1 h-13 rounded-full border border-[#F0DFC8] text-[#735340] font-bold text-sm flex items-center justify-center hover:bg-[#FAF0E4]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-13 rounded-full bg-[#E8772E] hover:bg-[#D4661E] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-5 h-5" />
            {isSubmitting ? 'Saving...' : 'List Car Now'}
          </button>
        </div>
      </form>
    </div>
  );
}

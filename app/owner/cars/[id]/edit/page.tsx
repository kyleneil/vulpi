import { createClient } from '@/lib/supabase/server';
import { DEMO_CARS } from '@/lib/mock-data';
import { updateCarAction, toggleCarActiveAction } from '@/app/actions/owner-cars';
import { CAR_TYPES } from '@/lib/constants';
import Link from 'next/link';
import { ArrowLeft, Save, PauseCircle, PlayCircle } from 'lucide-react';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCarPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  let car: any = null;

  const { data: fetchedCar } = await supabase
    .from('cars')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchedCar) {
    car = fetchedCar;
  } else {
    car = DEMO_CARS.find((c) => c.id === id) || DEMO_CARS[0];
  }

  async function handleUpdate(formData: FormData) {
    'use server';
    await updateCarAction(id, formData);
    redirect('/owner/cars');
  }

  async function handleToggleStatus() {
    'use server';
    await toggleCarActiveAction(id, !car.is_active);
    redirect(`/owner/cars/${id}/edit`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/owner/cars"
            className="w-10 h-10 rounded-full bg-white border border-[#F0DFC8] flex items-center justify-center text-[#735340] hover:bg-[#FAF0E4] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#3B2216]">
              Edit {car.make} {car.model}
            </h1>
            <p className="text-xs text-[#735340]">Update daily rental rates, specs, and status.</p>
          </div>
        </div>

        <form action={handleToggleStatus}>
          <button
            type="submit"
            className={`h-10 px-4 rounded-full font-bold text-xs flex items-center gap-1.5 transition-colors ${
              car.is_active
                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
            }`}
          >
            {car.is_active ? (
              <>
                <PauseCircle className="w-4 h-4" /> Pause Listing
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" /> Activate Listing
              </>
            )}
          </button>
        </form>
      </div>

      <form action={handleUpdate} className="bg-white rounded-3xl p-6 md:p-8 border border-[#F0DFC8] shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-[#735340] mb-1">Make</label>
            <input
              type="text"
              name="make"
              defaultValue={car.make}
              required
              className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-[#735340] mb-1">Model</label>
            <input
              type="text"
              name="model"
              defaultValue={car.model}
              required
              className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase text-[#735340] mb-1">Year</label>
            <input
              type="number"
              name="year"
              defaultValue={car.year}
              required
              className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-[#735340] mb-1">Seats</label>
            <input
              type="number"
              name="seats"
              defaultValue={car.seats}
              required
              className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-[#735340] mb-1">Type</label>
            <select
              name="car_type"
              defaultValue={car.car_type}
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
              defaultValue={car.transmission}
              className="w-full h-12 px-3 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
            >
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-[#735340] mb-1">Fuel</label>
            <select
              name="fuel_type"
              defaultValue={car.fuel_type}
              className="w-full h-12 px-3 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
            >
              <option value="gasoline">Gasoline</option>
              <option value="diesel">Diesel</option>
              <option value="hybrid">Hybrid</option>
              <option value="electric">Electric</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-[#735340] mb-1">Plate Number</label>
            <input
              type="text"
              name="plate_number"
              defaultValue={car.plate_number || ''}
              className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="pt-4 border-t border-[#F0DFC8]/60 space-y-4">
          <h3 className="font-bold text-base text-[#3B2216]">Rental Rates & Deposit (PHP ₱)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
                Daily Rate (In-City CDO) *
              </label>
              <input
                type="number"
                name="daily_rate_in_city"
                defaultValue={car.daily_rate_in_city}
                required
                className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm font-bold text-[#E8772E]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
                Daily Rate (Outside CDO)
              </label>
              <input
                type="number"
                name="daily_rate_out_of_city"
                defaultValue={car.daily_rate_out_of_city || ''}
                placeholder="Rate on request"
                className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm font-bold text-[#3B2216]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
                Security Deposit
              </label>
              <input
                type="number"
                name="security_deposit"
                defaultValue={car.security_deposit || ''}
                className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2 pt-4 border-t border-[#F0DFC8]/60">
          <label className="block text-xs font-bold uppercase text-[#735340]">Notes</label>
          <textarea
            name="notes"
            defaultValue={car.notes || ''}
            rows={3}
            className="w-full p-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
          />
        </div>

        <div className="pt-4 flex gap-3">
          <Link
            href="/owner/cars"
            className="flex-1 h-13 rounded-full border border-[#F0DFC8] text-[#735340] font-bold text-sm flex items-center justify-center hover:bg-[#FAF0E4]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="flex-1 h-13 rounded-full bg-[#E8772E] hover:bg-[#D4661E] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

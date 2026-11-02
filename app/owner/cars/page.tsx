import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatPHP } from '@/lib/formatters';
import { getSafeCarPhoto } from '@/lib/constants';
import { Plus, Calendar, Edit3, CheckCircle2, XCircle } from 'lucide-react';

export default async function OwnerCarsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let cars: any[] = [];

  const { data: owner } = await supabase
    .from('owners')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (owner) {
    const { data } = await supabase
      .from('cars')
      .select('*')
      .eq('owner_id', owner.id)
      .order('created_at', { ascending: false });
    cars = data || [];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#3B2216]">My Car Fleet</h1>
          <p className="text-sm text-[#735340] mt-1">
            Manage your rental listings, daily rates, and blocked dates.
          </p>
        </div>

        <Link
          href="/owner/cars/new"
          className="h-12 px-6 rounded-full bg-[#E8772E] hover:bg-[#D4661E] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Another Car
        </Link>
      </div>

      {cars.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#F0DFC8] shadow-sm max-w-lg mx-auto">
          <h3 className="font-bold text-lg text-[#3B2216]">No cars listed yet</h3>
          <p className="text-xs text-[#735340] mt-1 mb-6">
            Add your first car to start receiving rental requests in Cagayan de Oro.
          </p>
          <Link
            href="/owner/cars/new"
            className="inline-flex h-11 px-6 rounded-full bg-[#E8772E] text-white font-bold text-sm items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Car Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cars.map((car: any) => {
            const photo = getSafeCarPhoto(car.photos?.[0]);

            return (
              <div
                key={car.id}
                className="bg-white rounded-3xl p-5 border border-[#F0DFC8] shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-4">
                    <div className="relative w-28 h-20 rounded-2xl overflow-hidden bg-[#FAF0E4] shrink-0 border border-[#F0DFC8]">
                      <Image
                        src={photo}
                        alt={`${car.make} ${car.model}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF0E4] text-[#735340]">
                          {car.car_type}
                        </span>
                        {car.is_active ? (
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Listed
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Paused
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-base text-[#3B2216] mt-1">
                        {car.year} {car.make} {car.model}
                      </h3>
                      <p className="text-xs text-[#735340]">
                        {car.plate_number ? `Plate: ${car.plate_number} • ` : ''}
                        {car.seats} seats • {car.transmission}
                      </p>
                    </div>
                  </div>

                  {/* Rates */}
                  <div className="mt-4 pt-3 border-t border-[#F0DFC8]/60 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[#735340] block text-[11px]">In-City Rate:</span>
                      <span className="font-black text-[#E8772E] text-sm">
                        {formatPHP(car.daily_rate_in_city)}/day
                      </span>
                    </div>
                    <div>
                      <span className="text-[#735340] block text-[11px]">Out-of-City:</span>
                      <span className="font-bold text-[#3B2216]">
                        {formatPHP(car.daily_rate_out_of_city)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-[#F0DFC8]/60 flex items-center gap-2">
                  <Link
                    href={`/owner/cars/${car.id}/calendar`}
                    className="flex-1 h-10 rounded-xl bg-[#FFFBF5] hover:bg-[#FAF0E4] border border-[#F0DFC8] text-[#3B2216] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#1AA3A3]" />
                    Calendar & Blocks
                  </Link>
                  <Link
                    href={`/owner/cars/${car.id}/edit`}
                    className="h-10 px-4 rounded-xl border border-[#F0DFC8] hover:bg-[#FAF0E4] text-[#735340] font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

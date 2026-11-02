import { searchAvailableCars, findNearestAvailableDates } from '@/lib/availability/query';
import { CarCard } from '@/components/renter/CarCard';
import { SearchForm } from '@/components/renter/SearchForm';
import { NearestAvailableDates } from '@/components/renter/NearestAvailableDates';
import { CAR_TYPES } from '@/lib/constants';
import { DestinationType, CarType } from '@/types/database';
import { SlidersHorizontal, Car as CarIcon } from 'lucide-react';
import Link from 'next/link';

interface SearchPageProps {
  searchParams: Promise<{
    start?: string;
    end?: string;
    type?: string;
    dest?: string;
    transmission?: string;
    seats?: string;
    sort?: 'price_asc' | 'price_desc';
  }>;
}

export default async function CarsSearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const startDate = params.start;
  const endDate = params.end;
  const carType = params.type && params.type !== 'all' ? (params.type as CarType) : undefined;
  const destination = (params.dest as DestinationType) || 'within_cdo';
  const transmission = params.transmission;
  const seats = params.seats ? parseInt(params.seats, 10) : undefined;
  const sortBy = params.sort || 'price_asc';

  let cars = await searchAvailableCars({
    startDate,
    endDate,
    carType,
    destination,
    transmission,
    seats,
    sortBy,
  });

  // Nearest available dates suggestion algorithm if a specific car type was searched and none found
  let nearestSuggestions = undefined;
  const typeLabel = CAR_TYPES.find((t) => t.id === carType)?.label;

  if (cars.length === 0 && carType && startDate && endDate) {
    nearestSuggestions = await findNearestAvailableDates(carType, startDate, endDate);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Search Header Form */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#3B2216] mb-1">
          Available Cars in Cagayan de Oro
        </h1>
        <p className="text-xs text-[#735340] mb-5">
          Filtered strictly by verified real-time availability.
        </p>

        <SearchForm
          initialStartDate={startDate}
          initialEndDate={endDate}
          initialCarType={carType || 'all'}
          initialDestination={destination}
        />
      </div>

      {/* Filter and Sort bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#F0DFC8] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#735340]">
          <SlidersHorizontal className="w-4 h-4 text-[#E8772E]" />
          <span className="font-bold text-[#3B2216]">
            {cars.length} {cars.length === 1 ? 'car' : 'cars'} available
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Transmission Quick Filter */}
          <Link
            href={`/cars?start=${startDate || ''}&end=${endDate || ''}&type=${carType || 'all'}&dest=${destination}&transmission=automatic`}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              transmission === 'automatic'
                ? 'bg-[#1AA3A3] text-white'
                : 'bg-[#FFFBF5] border border-[#F0DFC8] text-[#735340] hover:text-[#3B2216]'
            }`}
          >
            Automatic Only
          </Link>

          {/* Sort By Price */}
          <div className="flex items-center gap-1 border-l border-[#F0DFC8] pl-2">
            <span className="text-[#735340] font-medium">Sort:</span>
            <Link
              href={`/cars?start=${startDate || ''}&end=${endDate || ''}&type=${carType || 'all'}&dest=${destination}&sort=price_asc`}
              className={`px-2.5 py-1 rounded-lg font-bold ${
                sortBy === 'price_asc' ? 'text-[#E8772E] bg-[#FFF4E6]' : 'text-[#735340]'
              }`}
            >
              Price: Low → High
            </Link>
            <Link
              href={`/cars?start=${startDate || ''}&end=${endDate || ''}&type=${carType || 'all'}&dest=${destination}&sort=price_desc`}
              className={`px-2.5 py-1 rounded-lg font-bold ${
                sortBy === 'price_desc' ? 'text-[#E8772E] bg-[#FFF4E6]' : 'text-[#735340]'
              }`}
            >
              Price: High → Low
            </Link>
          </div>
        </div>
      </div>

      {/* Results or Nearest Alternate Suggestion */}
      {cars.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              startDate={startDate}
              endDate={endDate}
              destination={destination}
            />
          ))}
        </div>
      ) : (
        <div className="py-8">
          {typeLabel && startDate && endDate ? (
            <NearestAvailableDates
              carTypeLabel={typeLabel}
              requestedStartDate={startDate}
              requestedEndDate={endDate}
              destination={destination}
              suggestions={nearestSuggestions}
            />
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#F0DFC8] shadow-sm max-w-md mx-auto">
              <CarIcon className="w-12 h-12 text-[#E8772E] mx-auto mb-3 opacity-60" />
              <h3 className="font-bold text-lg text-[#3B2216]">No matching vehicles found</h3>
              <p className="text-xs text-[#735340] mt-1 mb-5">
                Try widening your dates or changing your car type filter to view available rides in CDO.
              </p>
              <Link
                href="/cars"
                className="inline-flex h-11 px-6 rounded-full bg-[#E8772E] text-white font-bold text-xs items-center gap-2 shadow-md"
              >
                Reset Search Filters
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

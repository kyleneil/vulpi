import Link from 'next/link';
import { Mascot } from '@/components/brand/Mascot';
import { SearchForm } from '@/components/renter/SearchForm';
import { CarCard } from '@/components/renter/CarCard';
import { createClient } from '@/lib/supabase/server';
import { DEMO_CARS } from '@/lib/mock-data';
import { CAR_TYPES, APP_CONFIG } from '@/lib/constants';
import { ShieldCheck, Clock, CheckCircle2, PhoneCall, Sparkles, ArrowRight } from 'lucide-react';

export default async function HomePage() {
  const supabase = await createClient();

  let featuredCars = [];
  const { data: cars } = await supabase
    .from('cars')
    .select('*, owner:owners(*)')
    .eq('is_active', true)
    .limit(4);

  if (cars && cars.length > 0) {
    featuredCars = cars;
  } else {
    featuredCars = DEMO_CARS.slice(0, 4);
  }

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative pt-8 md:pt-14 pb-12 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          {/* Left Text */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF4E6] border border-[#F0DFC8] text-[#E8772E] text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#F5B82E]" />
              <span>Cagayan de Oro’s Dedicated Car Rental Marketplace</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#3B2216] leading-tight tracking-tight">
              Smart Rentals. <br />
              <span className="text-[#E8772E]">Smooth Journeys.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#735340] max-w-lg leading-relaxed font-normal">
              No more posting on social media or making endless phone calls. Compare real daily rates, check live availability, and request a car in seconds.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2 text-xs font-bold text-[#3B2216]">
              <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#F0DFC8]">
                <ShieldCheck className="w-4 h-4 text-[#1AA3A3]" /> Verified Local Owners
              </span>
              <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#F0DFC8]">
                <Clock className="w-4 h-4 text-[#E8772E]" /> 24-Hour Date Holds
              </span>
              <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#F0DFC8]">
                <PhoneCall className="w-4 h-4 text-[#F5B82E]" /> Direct Owner Confirmation
              </span>
            </div>
          </div>

          {/* Right Mascot Hero Card */}
          <div className="relative shrink-0 flex items-center justify-center">
            <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tr from-[#E6F4F1] to-[#FFF4E6] absolute -z-10 blur-xl opacity-70" />
            <div className="bg-white/80 backdrop-blur-xs p-6 rounded-3xl border border-[#F0DFC8] shadow-xl text-center flex flex-col items-center">
              <Mascot size="lg" priority />
              <div className="mt-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1AA3A3]">
                  Meet Vulpi
                </span>
                <p className="text-xs font-semibold text-[#3B2216] max-w-[200px] mt-0.5">
                  Your smart guide to exploring Northern Mindanao.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Search Form */}
        <div className="mt-10 md:mt-14 max-w-5xl mx-auto">
          <SearchForm />
        </div>
      </section>

      {/* Car Types Quick Carousel/Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#3B2216]">
              Browse by Vehicle Type
            </h2>
            <p className="text-xs text-[#735340] mt-0.5">
              From city runabouts to rugged Bukidnon tourers.
            </p>
          </div>
          <Link
            href="/cars"
            className="text-xs font-bold text-[#E8772E] hover:underline flex items-center gap-1"
          >
            See all vehicles <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {CAR_TYPES.map((type) => (
            <Link
              key={type.id}
              href={`/cars?type=${type.id}`}
              className="group bg-white p-4 rounded-2xl border border-[#F0DFC8] hover:border-[#E8772E] hover:shadow-md transition-all text-center flex flex-col items-center justify-center"
            >
              <span className="text-sm font-black text-[#3B2216] group-hover:text-[#E8772E] transition-colors">
                {type.label}
              </span>
              <span className="text-[10px] text-[#735340] mt-1 line-clamp-1">
                {type.sample.split(',')[0]}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Available Cars */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#3B2216]">
              Featured Rides in Cagayan de Oro
            </h2>
            <p className="text-xs text-[#735340] mt-0.5">
              Available with clear rates and verified local pickup locations.
            </p>
          </div>
          <Link
            href="/cars"
            className="text-xs font-bold text-[#E8772E] hover:underline flex items-center gap-1"
          >
            View all ({featuredCars.length}+) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredCars.map((car: any) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      </section>

      {/* How Vulpi Works */}
      <section className="bg-white py-12 border-y border-[#F0DFC8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1AA3A3]">
              Simple & Transparent
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#3B2216] mt-1">
              How Vulpi Works in Cagayan de Oro
            </h2>
            <p className="text-xs text-[#735340] mt-1.5">
              Rent cars smoothly with zero online transaction fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#FFFBF5] p-6 rounded-3xl border border-[#F0DFC8] relative">
              <span className="text-3xl font-black text-[#E8772E]/30 absolute top-4 right-5">01</span>
              <h3 className="font-bold text-base text-[#3B2216] mb-2">Search Real Dates</h3>
              <p className="text-xs text-[#735340] leading-relaxed">
                Enter your pickup and return dates. Vulpi only shows cars that are 100% available—no conflicting bookings or unlisted blocks.
              </p>
            </div>

            <div className="bg-[#FFFBF5] p-6 rounded-3xl border border-[#F0DFC8] relative">
              <span className="text-3xl font-black text-[#1AA3A3]/30 absolute top-4 right-5">02</span>
              <h3 className="font-bold text-base text-[#3B2216] mb-2">Hold Dates for 24h</h3>
              <p className="text-xs text-[#735340] leading-relaxed">
                Submit a booking request. The car’s calendar is instantly held for 24 hours while the owner reviews your request.
              </p>
            </div>

            <div className="bg-[#FFFBF5] p-6 rounded-3xl border border-[#F0DFC8] relative">
              <span className="text-3xl font-black text-[#F5B82E]/40 absolute top-4 right-5">03</span>
              <h3 className="font-bold text-base text-[#3B2216] mb-2">Direct Owner Handover</h3>
              <p className="text-xs text-[#735340] leading-relaxed">
                The owner contacts you directly by call or SMS. Settle payments with the owner upon pickup, inspect the car, and hit the road!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Vulpi Blurb Card */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-[#FFF4E6] to-[#FAF0E4] rounded-3xl p-8 border border-[#F0DFC8] shadow-sm flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <Mascot size="md" className="shrink-0" />
          <div className="space-y-2">
            <h3 className="text-xl font-black text-[#3B2216]">About Vulpi</h3>
            <p className="text-sm text-[#735340] leading-relaxed">
              {APP_CONFIG.aboutBlurb} We built Vulpi because renting a car in CDO shouldn’t require messaging 10 different Facebook groups or haggling over rates. We bring transparency, speed, and peace of mind to both car owners and travelers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

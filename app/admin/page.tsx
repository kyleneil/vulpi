import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatPHP, formatDateRangePH } from '@/lib/formatters';
import { toggleOwnerVerificationAction, adminToggleCarActiveAction } from '@/app/actions/admin';
import { Logo } from '@/components/brand/Logo';
import { AdminProfileModal } from '@/components/admin/AdminProfileModal';
import { AddOwnerModal } from '@/components/admin/AddOwnerModal';
import { ResetPasswordModal } from '@/components/admin/ResetPasswordModal';
import { CopyInstructionsButton } from '@/components/admin/CopyInstructionsButton';
import { isAdminEmail } from '@/lib/auth/admin';
import { Shield, Users, Car, Calendar, CheckCircle2, XCircle, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';

export default async function AdminPage() {
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    redirect('/login?admin=true');
  }

  const supabase = createAdminClient();

  const { data: fetchedOwners } = await supabase.from('owners').select('*').order('created_at', { ascending: false });
  const { data: fetchedCars } = await supabase.from('cars').select('*, owner:owners(*)').order('created_at', { ascending: false });
  const { data: fetchedBookings } = await supabase.from('bookings').select('*, car:cars(*)').order('created_at', { ascending: false });

  const owners = fetchedOwners || [];
  const cars = fetchedCars || [];
  const bookings = fetchedBookings || [];

  return (
    <div className="min-h-screen bg-[#FFFBF5] p-6 md:p-10 space-y-10 max-w-7xl mx-auto">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F0DFC8]">
        <div className="flex items-center gap-3">
          <Logo size="md" href="/" />
          <span className="px-3 py-1 rounded-full bg-[#E8772E] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs">
            <Shield className="w-3.5 h-3.5" /> Vulpi Admin
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin Profile & Settings Modal Trigger */}
          <AdminProfileModal adminEmail={user.email || 'vulpi.cdo@gmail.com'} />

          <Link
            href="/"
            className="text-xs font-bold text-[#735340] hover:text-[#E8772E] flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Public Marketplace
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#F0DFC8] shadow-sm">
          <div className="text-xs font-bold uppercase text-[#735340] flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#1AA3A3]" /> Registered Owners
          </div>
          <div className="text-3xl font-black text-[#3B2216] mt-2">{owners.length}</div>
          <span className="text-xs text-[#735340] mt-1 block">
            {owners.filter(o => o.is_verified).length} verified partners
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#F0DFC8] shadow-sm">
          <div className="text-xs font-bold uppercase text-[#735340] flex items-center gap-1.5">
            <Car className="w-4 h-4 text-[#E8772E]" /> Total Listings
          </div>
          <div className="text-3xl font-black text-[#3B2216] mt-2">{cars.length}</div>
          <span className="text-xs text-[#735340] mt-1 block">
            {cars.filter(c => c.is_active).length} active on marketplace
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#F0DFC8] shadow-sm">
          <div className="text-xs font-bold uppercase text-[#735340] flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#F5B82E]" /> Total Bookings
          </div>
          <div className="text-3xl font-black text-[#3B2216] mt-2">{bookings.length}</div>
          <span className="text-xs text-[#735340] mt-1 block">
            Held, confirmed, & completed
          </span>
        </div>
      </div>

      {/* Section 1: Owners Oversight & Account Provisioning */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0DFC8] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[#3B2216] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#1AA3A3]" /> Car Owners Oversight
            </h2>
            <p className="text-xs text-[#735340]">Manage registered partners, provision new owner accounts, and issue credentials.</p>
          </div>

          {/* Provision New Owner Modal */}
          <AddOwnerModal />
        </div>

        {owners.length === 0 ? (
          <div className="p-8 text-center bg-[#FFFBF5] rounded-2xl border border-dashed border-[#F0DFC8] text-xs text-[#735340] space-y-2">
            <p>No partner owners registered yet.</p>
            <p>Click &quot;<strong>+ Add / Provision Car Owner</strong>&quot; above to create accounts for local fleet operators.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#3B2216]">
              <thead>
                <tr className="border-b border-[#F0DFC8] text-[#735340] uppercase">
                  <th className="py-3 px-3">Owner / Business</th>
                  <th className="py-3 px-3">Account Email</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Pickup Location</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0DFC8]/50">
                {owners.map((owner) => {
                  async function handleToggle() {
                    'use server';
                    await toggleOwnerVerificationAction(owner.id, owner.is_verified);
                  }

                  return (
                    <tr key={owner.id} className="hover:bg-[#FFFBF5]/60 transition-colors">
                      <td className="py-3 px-3 font-bold">{owner.name_or_business}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[#735340]">{owner.email}</td>
                      <td className="py-3 px-3">{owner.phone}</td>
                      <td className="py-3 px-3">{owner.pickup_location}</td>
                      <td className="py-3 px-3">
                        {owner.is_verified ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="text-amber-700 font-bold">Unverified</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <CopyInstructionsButton
                            ownerName={owner.name_or_business}
                            email={owner.email}
                          />

                          {owner.user_id && (
                            <ResetPasswordModal
                              userId={owner.user_id}
                              ownerName={owner.name_or_business}
                              email={owner.email}
                            />
                          )}

                          <form action={handleToggle}>
                            <button
                              type="submit"
                              className="px-2.5 py-1 rounded-lg border border-[#F0DFC8] hover:bg-[#FAF0E4] font-bold text-[11px] cursor-pointer"
                            >
                              {owner.is_verified ? 'Revoke' : 'Verify'}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Cars Oversight */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0DFC8] shadow-sm space-y-4">
        <h2 className="text-lg font-black text-[#3B2216] flex items-center gap-2">
          <Car className="w-5 h-5 text-[#E8772E]" /> Fleet Listings Oversight
        </h2>

        {cars.length === 0 ? (
          <div className="p-8 text-center bg-[#FFFBF5] rounded-2xl border border-dashed border-[#F0DFC8] text-xs text-[#735340]">
            No vehicles listed yet. Cars added by verified CDO owners will be managed here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#3B2216]">
              <thead>
                <tr className="border-b border-[#F0DFC8] text-[#735340] uppercase">
                  <th className="py-3 px-3">Car</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Owner</th>
                  <th className="py-3 px-3">In-City Rate</th>
                  <th className="py-3 px-3">Listing Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0DFC8]/50">
                {cars.map((car) => {
                  async function handleToggleCar() {
                    'use server';
                    await adminToggleCarActiveAction(car.id, car.is_active);
                  }

                  return (
                    <tr key={car.id}>
                      <td className="py-3 px-3 font-bold">{car.year} {car.make} {car.model}</td>
                      <td className="py-3 px-3 uppercase text-[11px]">{car.car_type}</td>
                      <td className="py-3 px-3">{car.owner?.name_or_business}</td>
                      <td className="py-3 px-3 font-bold text-[#E8772E]">{formatPHP(car.daily_rate_in_city)}</td>
                      <td className="py-3 px-3">
                        {car.is_active ? (
                          <span className="text-emerald-700 font-bold">Active</span>
                        ) : (
                          <span className="text-stone-500 font-bold">Deactivated</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <form action={handleToggleCar}>
                          <button
                            type="submit"
                            className="px-3 py-1 rounded-lg border border-[#F0DFC8] hover:bg-[#FAF0E4] font-bold text-xs cursor-pointer"
                          >
                            {car.is_active ? 'Deactivate Listing' : 'Activate Listing'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: Bookings Ledger */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0DFC8] shadow-sm space-y-4">
        <h2 className="text-lg font-black text-[#3B2216] flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#F5B82E]" /> Bookings Ledger
        </h2>

        {bookings.length === 0 ? (
          <div className="p-8 text-center bg-[#FFFBF5] rounded-2xl border border-dashed border-[#F0DFC8] text-xs text-[#735340]">
            No booking reservations recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#3B2216]">
              <thead>
                <tr className="border-b border-[#F0DFC8] text-[#735340] uppercase">
                  <th className="py-3 px-3">Renter</th>
                  <th className="py-3 px-3">Car</th>
                  <th className="py-3 px-3">Rental Dates</th>
                  <th className="py-3 px-3">Est. Total</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0DFC8]/50">
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3 px-3 font-bold">{b.renter_name} ({b.renter_phone})</td>
                    <td className="py-3 px-3">{b.car?.make} {b.car?.model}</td>
                    <td className="py-3 px-3">{formatDateRangePH(b.start_date, b.end_date)}</td>
                    <td className="py-3 px-3 font-bold text-[#E8772E]">{formatPHP(b.estimated_total)}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded-full bg-[#FFF4E6] text-[#3B2216]">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

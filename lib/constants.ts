import { CarType, BlockReason } from '@/types/database';

export const APP_CONFIG = {
  name: 'Vulpi',
  tagline: 'Smart Rentals. Smooth Journeys.',
  aboutBlurb: 'Vulpi is inspired by the fox (Vulpes): clever, agile, and quick to find the right ride.',
  cdoLocation: 'Cagayan de Oro City, Misamis Oriental, Philippines',
  timezone: 'Asia/Manila',
  currency: 'PHP',
  holdHours: 24,
};

export const CAR_TYPES: { id: CarType; label: string; description: string; sample: string }[] = [
  { id: 'sedan', label: 'Sedan', description: 'Comfortable, fuel efficient', sample: 'Toyota Vios, Honda City' },
  { id: 'hatchback', label: 'Hatchback', description: 'Compact & agile for city traffic', sample: 'Mitsubishi Mirage, Wigo' },
  { id: 'suv', label: 'SUV', description: 'Spacious & ready for highlands', sample: 'Fortuner, Montero Sport' },
  { id: 'mpv', label: 'MPV', description: 'Roomy 7-8 seater for families', sample: 'Toyota Innova, Avanza' },
  { id: 'van', label: 'Van', description: 'Large capacity 10-15 seater', sample: 'Toyota HiAce, Commuter' },
  { id: 'pickup', label: 'Pickup', description: 'Tough cargo bed for adventures', sample: 'Ford Ranger, Hilux' },
];

export const POPULAR_CDO_DESTINATIONS = [
  { label: 'Within CDO City', value: 'within_cdo', hint: 'Divisoria, Limketkai, Uptown, Carmen, Airport Route' },
  { label: 'Outside CDO', value: 'outside_cdo', hint: 'Dahilayan Bukidnon, Iligan, Initao Beach, Balingasag' },
];

export const BLOCK_REASONS: { id: BlockReason; label: string }[] = [
  { id: 'repairs', label: 'Maintenance / Repairs' },
  { id: 'personal', label: 'Personal Use' },
  { id: 'offline_booking', label: 'Offline / Direct Booking' },
];

export const STARTER_TERMS_TEMPLATE = `1. RENTAL PERIOD & RETURN:
Rental day is 24 hours from pickup. Grace period is 1 hour. Late returns beyond 1 hour are charged at ₱200/hour up to 4 hours; beyond 4 hours, a full day rate applies.

2. REQUIRED DOCUMENTS:
Valid Philippine Driver's License (or International Driving Permit for foreign nationals) and 1 government-issued secondary ID must be presented upon vehicle handover.

3. SECURITY DEPOSIT:
A refundable security deposit is required upon vehicle pickup and will be returned within 24 hours after inspection upon vehicle return.

4. FUEL POLICY:
Same-to-same fuel policy. The vehicle must be returned with the same fuel level as recorded at handover. Shortfall is charged at current local pump rates + ₱150 service fee.

5. OUT-OF-CITY TRAVEL:
Trips outside Cagayan de Oro City limits (e.g., Bukidnon, Iligan, Initao, Dahilayan, Balingasag) must be declared prior to departure and charged under the out-of-city rate.

6. PROHIBITED USES:
Sub-renting, street racing, towing other vehicles, transportation of illicit goods, or driving under the influence of alcohol/drugs is strictly prohibited.

7. TRAFFIC VIOLATIONS & TOLLS:
The renter is fully liable for any traffic citations, speeding tickets, and RFID/toll fees incurred during the rental window.

8. ACCIDENTS & DAMAGE:
In the event of an accident, notify the owner immediately and obtain a police report. Renter is liable for the participation fee or actual repair cost according to assessment.

9. CLEANING FEE:
Excessive interior dirt, mud, sand, foul odor, or stains requiring deep detailing will incur a cleaning fee of ₱500–₱1,500.

10. CANCELLATION:
Please notify the owner at least 24 hours prior to pickup if you need to reschedule or cancel your reservation.`;

export const DEFAULT_CAR_PHOTO = 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1000&q=80';

export function getSafeCarPhoto(url?: string | null): string {
  if (!url || typeof url !== 'string' || url.includes('1590362891988')) {
    return DEFAULT_CAR_PHOTO;
  }
  return url;
}


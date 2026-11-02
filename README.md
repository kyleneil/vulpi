# Vulpi — Car Rental Marketplace (Cagayan de Oro City)

> **Tagline:** *"Smart Rentals. Smooth Journeys."*  
> **Inspiration:** Inspired by the fox (*Vulpes*): clever, agile, and quick to find the right ride.

Vulpi is a mobile-first web app built for car rentals in **Cagayan de Oro City, Misamis Oriental, Philippines**. It eliminates the friction of posting on Facebook groups or making endless phone calls just to check daily rates and find out if a car is available.

Car owners list their vehicles with transparent in-city and out-of-city rates, manage their blocked maintenance days, and confirm requests directly. Renters search by dates and vehicle type, see only cars that are actually free, and send a booking request that holds the vehicle for 24 hours.

---

## 🦊 Features & Workflow

### 1. Renter Experience (Zero-friction, No Account Needed)
- **Live Search:** Filter cars strictly available for the whole date range.
- **In-City vs. Out-of-City Rates:** Clear rates in Philippine Peso (PHP, ₱) for trips within CDO vs. trips to Dahilayan, Bukidnon highlands, Iligan, Initao, etc.
- **Nearest Date Suggestions:** If a car type is fully booked on the requested dates, Vulpi immediately recommends the closest upcoming open dates (e.g., *"No SUVs free Nov 10–13. Available Nov 14–17 or Nov 6–9"*).
- **Interactive Calendar:** Car details page shows unavailable/held days greyed out and open days highlighted.
- **24-Hour Date Hold:** Submitting a request locks the car's calendar for 24 hours.
- **Direct Handover:** Zero online transaction fees. The owner contacts the renter via click-to-call, SMS, or Messenger to confirm arrangements; payment is settled directly upon vehicle pickup.

### 2. Owner Portal (`/owner/dashboard`)
- **Fleet Management:** Add, edit, pause, and activate cars with multi-photo upload and custom specs.
- **Per-Car Calendar:** Interactive calendar view of confirmed bookings, pending holds, and manual block dates (for repairs, personal errands, or walk-in offline bookings).
- **Requests Inbox:** Full request cards with renter contact, destination itinerary, optional driver's license viewer, and one-click actions:
  - **Confirm**
  - **Decline** (with optional note)
  - **Mark Completed**
  - **Click-to-Call** and **Click-to-SMS**
- **Terms & Conditions Text Editor:** Starter 10-point CDO rental agreement template (fuel policy, rental period, security deposit, out-of-city rules, prohibited uses, cancellation).
- **Printable A4 Signed Agreement:** Downloadable 2-page PDF generated via `@react-pdf/renderer`:
  - **Page 1:** Contract with owner & renter details, car specs, daily rate, total, deposit, full terms, and paper signature lines.
  - **Page 2:** Physical vehicle handover inspection checklist (fuel gauge, odometer reading, spare tire/jack, scratches/dents diagram, and handover signatures for pickup and return).

### 3. Availability Logic & Database Concurrency (Critical)
- **Postgres Exclusion Constraint:** Enforced in PostgreSQL using `btree_gist` on `daterange(start_date, end_date, '[]')` for statuses holding dates (`pending`, `confirmed`).
- **Inclusive Dates:** Both start and end dates are included. Back-to-back rentals (e.g. Oct 1–5 and Oct 6–10) are allowed; same-day overlap is rejected.
- **Cross-table Integrity:** PostgreSQL triggers ensure `blocked_dates` and `bookings` cannot intersect.
- **24-Hour Hold Auto-Expiry:** Stale holds are automatically expired at query time and through the scheduled cron endpoint (`/api/cron/expire-holds`).
- **Friendly Server-Side Validation:** Returns *"Sorry, those dates were just taken"* if another renter reserves simultaneously.

### 4. Admin Oversight (`/admin`)
- Directory of all registered owners with one-click verification toggles.
- Marketplace fleet oversight with listing activation/deactivation.
- Global bookings ledger.

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router, React 19, Turbopack, TypeScript)
- **Styling:** Tailwind CSS with Vulpi brand tokens:
  - Fox Orange: `#E8772E` (Primary)
  - Teal: `#1AA3A3` (Secondary)
  - Dark Teal: `#0F7F82` (Hover/Active)
  - Cream: `#FFF4E6` (Surfaces)
  - Gold: `#F5B82E` (Accent)
  - Dark Brown: `#3B2216` (Text)
  - Font: Poppins & Nunito
- **Database & Storage:** Supabase (Postgres, Auth, Storage, Row Level Security)
- **PDF Engine:** `@react-pdf/renderer`
- **Notifications:** Resend email adapter with clean notification service layer for SMS/Messenger extensions
- **Date Management:** `date-fns` (Timezone: `Asia/Manila`, Currency: `PHP ₱`)

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/vulpi.git
cd vulpi
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your configuration:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=Vulpi Car Rentals <notifications@vulpi.ph>
BOOKING_HOLD_HOURS=24
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
*(Note: Connect your Supabase instance to load and manage live CDO vehicle fleet data).*

### 3. Supabase Database Setup & Seed
1. Go to your Supabase SQL Editor.
2. Run `supabase/migrations/20261031000000_initial_schema.sql` to install extensions, tables, triggers, and RLS policies.
3. Run `supabase/seed.sql` to populate sample data:
   - **2 Owners:** Kagay-an Wheels (Uptown CDO) & Oro Express (Downtown / Limketkai)
   - **6 Cars:** Toyota Vios (sedan), Mirage (hatchback), Fortuner (SUV), Innova (MPV), HiAce Grandia (van), Ranger Wildtrak (pickup)
   - Sample blocked dates and active bookings.

### 4. Run the Availability Test Suite
Execute the 5 unit tests verifying overlap detection, back-to-back rentals, blocked maintenance, expired holds, and simultaneous race-condition requests:
```bash
npm test
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Availability Test Scenarios Covered

The automated test suite (`tests/availability.test.ts`) verifies:
1. **Overlapping ranges:** Partial overlaps, fully nested ranges, and same-day collisions are rejected.
2. **Back-to-back bookings:** Booking A ending on Nov 5 and Booking B starting on Nov 6 are cleanly permitted.
3. **Blocked dates:** Rental requests spanning maintenance or personal blocks are prevented.
4. **Expired hold release:** A pending hold older than 24 hours automatically releases dates for new renters.
5. **Simultaneous requests:** When two renters request overlapping dates for the same car at the exact same moment, the first succeeds and the second receives: *"Sorry, those dates were just taken"*.

---

## 📄 License
Proprietary software for Vulpi Car Rentals. Built for Cagayan de Oro City, Philippines.

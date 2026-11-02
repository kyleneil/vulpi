import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEMO_CARS, DEMO_OWNERS } from '@/lib/mock-data';
import { STARTER_TERMS_TEMPLATE } from '@/lib/constants';
import { AgreementDocument, AgreementData } from '@/lib/pdf/agreement-document';
import { calculateRentalDays } from '@/lib/formatters';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = createAdminClient();

    let agreementData: AgreementData | null = null;

    const { data: booking } = await supabase
      .from('bookings')
      .select('*, car:cars(*, owner:owners(*))')
      .eq('id', id)
      .single();

    if (booking && booking.car) {
      const car = booking.car;
      const owner = car.owner;
      const rentalDays = calculateRentalDays(booking.start_date, booking.end_date);
      const dailyRate =
        booking.destination_type === 'outside_cdo' && car.daily_rate_out_of_city
          ? car.daily_rate_out_of_city
          : car.daily_rate_in_city;

      agreementData = {
        bookingId: booking.id,
        createdAt: booking.created_at,
        carMake: car.make,
        carModel: car.model,
        carYear: car.year,
        plateNumber: car.plate_number || '',
        fuelType: car.fuel_type,
        seats: car.seats,
        transmission: car.transmission,
        ownerName: owner?.name_or_business || 'Car Owner',
        ownerPhone: owner?.phone || '',
        ownerLocation: owner?.pickup_location || 'Cagayan de Oro City',
        renterName: booking.renter_name,
        renterPhone: booking.renter_phone,
        renterEmail: booking.renter_email || undefined,
        startDate: booking.start_date,
        endDate: booking.end_date,
        rentalDays,
        destination: booking.destination_type,
        destinationDetails: booking.destination_details || undefined,
        dailyRate,
        driverFee: booking.with_driver && car.driver_fee ? car.driver_fee : undefined,
        estimatedTotal: booking.estimated_total,
        securityDeposit: car.security_deposit || undefined,
        termsText: owner?.terms_text || STARTER_TERMS_TEMPLATE,
      };
    } else {
      // Demo mock fallback
      const demoCar = DEMO_CARS[0];
      const demoOwner = DEMO_OWNERS[0];
      agreementData = {
        bookingId: id,
        createdAt: new Date().toISOString(),
        carMake: demoCar.make,
        carModel: demoCar.model,
        carYear: demoCar.year,
        plateNumber: demoCar.plate_number || 'KAA 1234',
        fuelType: demoCar.fuel_type,
        seats: demoCar.seats,
        transmission: demoCar.transmission,
        ownerName: demoOwner.name_or_business,
        ownerPhone: demoOwner.phone,
        ownerLocation: demoOwner.pickup_location,
        renterName: 'Mark Villanueva',
        renterPhone: '+63 917 555 1234',
        renterEmail: 'mark.v@example.ph',
        startDate: '2026-11-05',
        endDate: '2026-11-07',
        rentalDays: 3,
        destination: 'within_cdo',
        destinationDetails: 'Airport pickup and city business trip',
        dailyRate: 1600,
        estimatedTotal: 4800,
        securityDeposit: 2000,
        termsText: demoOwner.terms_text || STARTER_TERMS_TEMPLATE,
      };
    }

    const pdfDocument = React.createElement(AgreementDocument, { data: agreementData }) as any;
    const buffer = await renderToBuffer(pdfDocument);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="vulpi-agreement-${id.substring(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[API Agreements PDF Error]', error);
    return NextResponse.json({ error: 'Failed to generate PDF agreement' }, { status: 500 });
  }
}

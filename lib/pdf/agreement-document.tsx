import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { formatPHP, formatDateRangePH } from '@/lib/formatters';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#3B2216',
    lineHeight: 1.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#E8772E',
    paddingBottom: 10,
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#E8772E',
  },
  brandSub: {
    fontSize: 8,
    color: '#735340',
    marginTop: 2,
  },
  docTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#3B2216',
    textAlign: 'right',
  },
  bookingRef: {
    fontSize: 8,
    color: '#735340',
    textAlign: 'right',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#FFF4E6',
    color: '#3B2216',
    padding: '4 8',
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0DFC8',
    paddingVertical: 3,
  },
  colLeft: {
    width: '35%',
    fontFamily: 'Helvetica-Bold',
    color: '#735340',
  },
  colRight: {
    width: '65%',
    color: '#3B2216',
  },
  termsBox: {
    backgroundColor: '#FFFBF5',
    borderWidth: 0.5,
    borderColor: '#F0DFC8',
    borderRadius: 4,
    padding: 6,
    fontSize: 7.5,
    color: '#3B2216',
    lineHeight: 1.25,
    maxHeight: 170,
  },
  signaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 8,
  },
  sigBox: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: '#3B2216',
    paddingTop: 4,
    textAlign: 'center',
  },
  sigLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#3B2216',
  },
  sigDate: {
    fontSize: 7.5,
    color: '#735340',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    textAlign: 'center',
    fontSize: 7.5,
    color: '#735340',
    borderTopWidth: 0.5,
    borderTopColor: '#F0DFC8',
    paddingTop: 6,
  },
  // Page 2 Checklist styles
  checklistGrid: {
    marginTop: 8,
    borderWidth: 0.5,
    borderColor: '#F0DFC8',
    borderRadius: 4,
  },
  checklistRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0DFC8',
    padding: 5,
  },
  checkCol1: { width: '40%', fontFamily: 'Helvetica-Bold' },
  checkCol2: { width: '30%' },
  checkCol3: { width: '30%' },
  sketchArea: {
    height: 90,
    borderWidth: 0.5,
    borderColor: '#F0DFC8',
    borderRadius: 4,
    backgroundColor: '#FFFBF5',
    marginVertical: 8,
    padding: 6,
    fontSize: 7.5,
    color: '#735340',
  },
});

export interface AgreementData {
  bookingId: string;
  createdAt: string;
  carMake: string;
  carModel: string;
  carYear: number;
  plateNumber: string;
  fuelType: string;
  seats: number;
  transmission: string;
  ownerName: string;
  ownerPhone: string;
  ownerLocation: string;
  renterName: string;
  renterPhone: string;
  renterEmail?: string;
  startDate: string;
  endDate: string;
  rentalDays: number;
  destination: string;
  destinationDetails?: string;
  dailyRate: number;
  driverFee?: number;
  estimatedTotal: number;
  securityDeposit?: number;
  termsText: string;
}

export function AgreementDocument({ data }: { data: AgreementData }) {
  const datesFormatted = formatDateRangePH(data.startDate, data.endDate);

  return (
    <Document>
      {/* PAGE 1: RENTAL AGREEMENT CONTRACT */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandTitle}>VULPI</Text>
            <Text style={styles.brandSub}>Smart Rentals. Smooth Journeys. • Cagayan de Oro City</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>CAR RENTAL AGREEMENT</Text>
            <Text style={styles.bookingRef}>Ref: {data.bookingId.substring(0, 13).toUpperCase()}</Text>
          </View>
        </View>

        {/* 1. Parties */}
        <Text style={styles.sectionTitle}>1. Parties to the Agreement</Text>
        <View style={styles.tableRow}>
          <Text style={styles.colLeft}>Car Owner / Provider:</Text>
          <Text style={styles.colRight}>{data.ownerName} ({data.ownerPhone})</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.colLeft}>Pickup Location:</Text>
          <Text style={styles.colRight}>{data.ownerLocation}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.colLeft}>Renter (Primary Driver):</Text>
          <Text style={styles.colRight}>{data.renterName} ({data.renterPhone})</Text>
        </View>

        {/* 2. Vehicle Details */}
        <Text style={styles.sectionTitle}>2. Vehicle Description</Text>
        <View style={styles.tableRow}>
          <Text style={styles.colLeft}>Make, Model & Year:</Text>
          <Text style={styles.colRight}>{data.carYear} {data.carMake} {data.carModel}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.colLeft}>Plate / Conduction No:</Text>
          <Text style={styles.colRight}>{data.plateNumber || '____________________'}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.colLeft}>Specifications:</Text>
          <Text style={styles.colRight}>{data.seats} Seats • {data.transmission} • {data.fuelType}</Text>
        </View>

        {/* 3. Rental Period & Agreed Pricing */}
        <Text style={styles.sectionTitle}>3. Rental Period & Agreed Rates</Text>
        <View style={styles.tableRow}>
          <Text style={styles.colLeft}>Rental Dates:</Text>
          <Text style={styles.colRight}>{datesFormatted} ({data.rentalDays} {data.rentalDays === 1 ? 'day' : 'days'})</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.colLeft}>Declared Destination:</Text>
          <Text style={styles.colRight}>
            {data.destination === 'outside_cdo' ? 'Outside Cagayan de Oro' : 'Within Cagayan de Oro City'}
            {data.destinationDetails ? ` (${data.destinationDetails})` : ''}
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.colLeft}>Daily Rate / Driver Fee:</Text>
          <Text style={styles.colRight}>
            {formatPHP(data.dailyRate)} / day {data.driverFee ? `+ ${formatPHP(data.driverFee)} driver fee` : ''}
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.colLeft}>Total Rental Fee:</Text>
          <Text style={styles.colRight}>{formatPHP(data.estimatedTotal)}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.colLeft}>Refundable Security Deposit:</Text>
          <Text style={styles.colRight}>{formatPHP(data.securityDeposit || 0)} (Payable upon vehicle pickup)</Text>
        </View>

        {/* 4. Terms and Conditions */}
        <Text style={styles.sectionTitle}>4. Owner Terms & Conditions</Text>
        <View style={styles.termsBox}>
          <Text>{data.termsText}</Text>
        </View>

        {/* Signatures */}
        <View style={styles.signaturesContainer}>
          <View style={styles.sigBox}>
            <Text style={styles.sigLabel}>Owner's Signature over Printed Name</Text>
            <Text style={styles.sigDate}>Date: ________________________</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigLabel}>Renter's Signature over Printed Name</Text>
            <Text style={styles.sigDate}>Date: ________________________</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Page 1 of 2 • Printed via Vulpi Car Rental Marketplace (Cagayan de Oro) • Non-transferable Agreement
        </Text>
      </Page>

      {/* PAGE 2: VEHICLE CONDITION CHECKLIST */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brandTitle}>VULPI</Text>
            <Text style={styles.brandSub}>Vehicle Inspection & Handover Checklist</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>CONDITION REPORT</Text>
            <Text style={styles.bookingRef}>Plate: {data.plateNumber || '__________'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Handover Readings</Text>
        <View style={styles.checklistGrid}>
          <View style={[styles.checklistRow, { backgroundColor: '#FFF4E6' }]}>
            <Text style={styles.checkCol1}>Check Item</Text>
            <Text style={styles.checkCol2}>At Pickup (Dispatch)</Text>
            <Text style={styles.checkCol3}>At Return (Check-in)</Text>
          </View>
          <View style={styles.checklistRow}>
            <Text style={styles.checkCol1}>Fuel Level (1/4, 1/2, 3/4, Full):</Text>
            <Text style={styles.checkCol2}>[   ] [   ] [   ] [   ]</Text>
            <Text style={styles.checkCol3}>[   ] [   ] [   ] [   ]</Text>
          </View>
          <View style={styles.checklistRow}>
            <Text style={styles.checkCol1}>Odometer (km reading):</Text>
            <Text style={styles.checkCol2}>________________ km</Text>
            <Text style={styles.checkCol3}>________________ km</Text>
          </View>
          <View style={styles.checklistRow}>
            <Text style={styles.checkCol1}>Spare Tire & Tire Jack:</Text>
            <Text style={styles.checkCol2}>[  ] Present and intact</Text>
            <Text style={styles.checkCol3}>[  ] Verified returned</Text>
          </View>
          <View style={styles.checklistRow}>
            <Text style={styles.checkCol1}>Early Warning Device (EWD):</Text>
            <Text style={styles.checkCol2}>[  ] Present</Text>
            <Text style={styles.checkCol3}>[  ] Present</Text>
          </View>
          <View style={styles.checklistRow}>
            <Text style={styles.checkCol1}>Interior Cleanliness / Mats:</Text>
            <Text style={styles.checkCol2}>[  ] Clean / stain-free</Text>
            <Text style={styles.checkCol3}>[  ] Clean / fee assessed</Text>
          </View>
          <View style={styles.checklistRow}>
            <Text style={styles.checkCol1}>Original OR / CR photocopy:</Text>
            <Text style={styles.checkCol2}>[  ] Inside glove box</Text>
            <Text style={styles.checkCol3}>[  ] Present</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Existing Scratches, Dents, or Defects Notes</Text>
        <View style={styles.sketchArea}>
          <Text>
            Note any pre-existing exterior damage (bumpers, doors, windshield chips, rims) before dispatch:
            {"\n\n"}
            ___________________________________________________________________________________________________
            {"\n\n"}
            ___________________________________________________________________________________________________
          </Text>
        </View>

        {/* Pickup Verification Signatures */}
        <Text style={styles.sectionTitle}>Pickup Verification (Vehicle Handed Over)</Text>
        <View style={styles.signaturesContainer}>
          <View style={styles.sigBox}>
            <Text style={styles.sigLabel}>Owner / Agent Handover Signature</Text>
            <Text style={styles.sigDate}>Time & Date: ________________________</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigLabel}>Renter Acceptance Signature</Text>
            <Text style={styles.sigDate}>Time & Date: ________________________</Text>
          </View>
        </View>

        {/* Return Verification Signatures */}
        <Text style={styles.sectionTitle}>Return & Deposit Settlement Verification</Text>
        <View style={styles.signaturesContainer}>
          <View style={styles.sigBox}>
            <Text style={styles.sigLabel}>Owner Return Inspection Signature</Text>
            <Text style={styles.sigDate}>Deposit Returned: ₱________________</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigLabel}>Renter Deposit Received Signature</Text>
            <Text style={styles.sigDate}>Time & Date: ________________________</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Page 2 of 2 • Physical Vehicle Handover Report • Vulpi CDO
        </Text>
      </Page>
    </Document>
  );
}

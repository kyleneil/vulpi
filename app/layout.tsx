import type { Metadata, Viewport } from "next";
import { Poppins, Nunito } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

const nunito = Nunito({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://vulpi.ph'),
  title: "Vulpi — Smart Rentals. Smooth Journeys. | Car Rental Cagayan de Oro",
  description:
    "Rent verified cars directly from local owners in Cagayan de Oro City. Clear daily rates, instant availability check, zero hidden fees.",
  keywords: [
    "car rental Cagayan de Oro",
    "rent a car CDO",
    "Vulpi",
    "sedan rental CDO",
    "SUV rental Cagayan de Oro",
    "van rental CDO",
  ],
  authors: [{ name: "Vulpi" }],
  openGraph: {
    title: "Vulpi — Smart Rentals. Smooth Journeys.",
    description: "Car rentals in Cagayan de Oro City made effortless.",
    url: "https://vulpi.ph",
    siteName: "Vulpi Car Rentals",
    images: [
      {
        url: "/brand/vulpi-mascot.svg",
        width: 800,
        height: 800,
        alt: "Vulpi the fox mascot",
      },
    ],
    locale: "en_PH",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#E8772E",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${nunito.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#FFFBF5] text-[#3B2216] selection:bg-[#E8772E]/20">
        {children}
      </body>
    </html>
  );
}

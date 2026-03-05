import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Haul Pass — Moving Truck Fuel Return Calculator",
    template: "%s | Haul Pass",
  },
  description:
    "Calculate exactly how many gallons of fuel to add before returning your U-Haul or moving truck. Avoid surprise fuel charges — get the precise amount for your truck size and gauge level.",
  keywords: [
    "U-Haul fuel return calculator",
    "how much gas to return U-Haul",
    "moving truck fuel calculator",
    "U-Haul fuel return",
    "how many gallons to fill U-Haul",
    "moving truck return fuel estimator",
  ],
  openGraph: {
    type: "website",
    siteName: "Haul Pass",
    title: "Haul Pass — Moving Truck Fuel Return Calculator",
    description:
      "Calculate exactly how many gallons of fuel to add before returning your moving truck. No more guessing at the pump.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Haul Pass — Moving Truck Fuel Return Calculator",
    description:
      "Calculate exactly how many gallons of fuel to add before returning your moving truck.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

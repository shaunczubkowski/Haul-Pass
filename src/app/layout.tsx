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
  metadataBase: new URL("https://getfillright.com"),
  title: {
    default: "FillRight — U-Haul Fuel Return Calculator",
    template: "%s | FillRight",
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
    "FillRight",
    "getfillright.com",
  ],
  openGraph: {
    type: "website",
    siteName: "FillRight",
    title: "FillRight — U-Haul Fuel Return Calculator",
    description:
      "Calculate exactly how many gallons to add before returning your moving truck. No more guessing at the pump.",
    url: "https://getfillright.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FillRight — U-Haul Fuel Return Calculator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FillRight — U-Haul Fuel Return Calculator",
    description:
      "Calculate exactly how many gallons to add before returning your moving truck.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://getfillright.com",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const jsonLdData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "FillRight",
  description:
    "Calculate exactly how many gallons of fuel to add before returning your U-Haul or moving truck. Avoid surprise fuel charges.",
  url: "https://getfillright.com",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <JsonLd />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

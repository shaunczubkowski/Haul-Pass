import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { Footer } from "@/components/Footer";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.getfillright.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FillRight — Moving Truck Fuel Return Calculator | U-Haul, Penske, Budget",
    template: "%s | FillRight",
  },
  description:
    "Avoid the $30 rental truck fuel surcharge. FillRight calculates the exact gallons to add before returning your U-Haul, Penske, Budget, or Enterprise truck — free, instant, no signup.",
  keywords: [
    "U-Haul fuel return calculator",
    "how much gas to return U-Haul",
    "moving truck fuel calculator",
    "U-Haul fuel return",
    "how many gallons to fill U-Haul",
    "moving truck return fuel estimator",
    "Penske fuel return calculator",
    "Budget truck fuel calculator",
    "Enterprise truck fuel calculator",
    "how much gas to return Penske",
    "rental truck fuel policy",
    "avoid U-Haul fuel surcharge",
    "U-Haul $30 fuel fee",
    "moving truck gas calculator",
    "how many gallons 15 ft U-Haul",
    "how many gallons 26 ft U-Haul",
    "FillRight",
    "getfillright.com",
  ],
  manifest: "/manifest.json",
  themeColor: "#0284c7",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FillRight",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "FillRight",
    title: "FillRight — Moving Truck Fuel Return Calculator | U-Haul, Penske, Budget",
    description:
      "Avoid the $30 fuel surcharge. Get the exact gallons to add before returning your U-Haul, Penske, Budget, or Enterprise truck — free and instant.",
    url: siteUrl,
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FillRight — Moving Truck Fuel Return Calculator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FillRight — Moving Truck Fuel Return Calculator",
    description:
      "Avoid the $30 fuel surcharge. Get the exact gallons to add before returning your U-Haul, Penske, Budget, or Enterprise truck.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const jsonLdOrgData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "FillRight",
  url: siteUrl,
  description:
    "Free moving truck fuel return calculator — avoid the $30 rental surcharge with U-Haul, Penske, Budget, and Enterprise.",
};

export function JsonLdOrg() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrgData) }}
    />
  );
}

export const jsonLdData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "FillRight",
  description:
    "Calculate exactly how many gallons of fuel to add before returning your U-Haul or moving truck. Avoid surprise fuel charges.",
  url: siteUrl,
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  featureList: "Fuel calculation, Unit conversion, Shareable results",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    offerType: "https://schema.org/OnlineOnly",
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

// Re-exported for backwards compatibility — data lives in @/data/json-ld.
export { jsonLdFaqData } from "@/data/json-ld";

export function JsonLdFaq() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaqData) }}
    />
  );
}

// Re-exported for backwards compatibility — data lives in @/data/json-ld.
export { jsonLdHowToData } from "@/data/json-ld";

export function JsonLdHowTo() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdHowToData) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-text-primary focus:shadow-lg focus:ring-2 focus:ring-ring"
          >
            Skip to main content
          </a>
          <JsonLdOrg />
          <JsonLd />
          <ServiceWorkerRegistration />
          {children}
          <Footer />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}

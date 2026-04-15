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

export const jsonLdFaqData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How much gas do I need to return a U-Haul?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It depends on your truck size, the fuel level at pickup, your current level, and how far you still need to drive. Use FillRight to get the exact gallon count for your specific U-Haul truck — it accounts for tank capacity, fuel efficiency, and a small safety buffer so you return at or above the level on your contract.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if I return a U-Haul without enough fuel?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "U-Haul charges a $30 fuel service fee plus above-market per-gallon rates to top up the difference. You end up paying significantly more than you would at a regular gas station. FillRight helps you avoid this by showing you exactly how many gallons to add before returning.",
      },
    },
    {
      "@type": "Question",
      name: "Does U-Haul use regular gas or diesel?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "All U-Haul trucks use regular unleaded gasoline — never diesel. Penske trucks use diesel fuel. Budget and Enterprise trucks use regular unleaded. FillRight displays the correct fuel type for every supported truck so you fill up at the right pump.",
      },
    },
    {
      "@type": "Question",
      name: "How accurate is the fuel gauge on a moving truck?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Moving truck fuel gauges can lag or read slightly low, especially after refueling. FillRight adds a small safety buffer to your calculation to account for this, so you're protected even if the gauge isn't perfectly accurate when you return.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use FillRight for Penske, Budget, and Enterprise trucks?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. FillRight supports all four major rental companies: U-Haul, Penske, Budget, and Enterprise. Each company's trucks have accurate tank capacity and fuel efficiency data built in, so your calculation is specific to your exact truck model.",
      },
    },
    {
      "@type": "Question",
      name: "How do I avoid the U-Haul fuel surcharge?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Return the truck at or above the fuel level shown on your rental contract. FillRight calculates the exact number of gallons you need to add — accounting for your current fuel level and any remaining miles to the drop-off location — so you can fill up at a regular gas station and avoid the surcharge entirely.",
      },
    },
    {
      "@type": "Question",
      name: "What is U-Haul's fuel policy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "U-Haul requires you to return the truck at the same fuel level documented on your rental agreement at the time of pickup. If you return it below that level, U-Haul charges a service fee plus per-gallon refueling costs at their rates, which are typically higher than local gas station prices.",
      },
    },
  ],
};

export function JsonLdFaq() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaqData) }}
    />
  );
}

export const jsonLdHowToData = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Calculate Fuel Needed to Return a Rental Truck",
  description:
    "Use FillRight to find the exact gallons to add before returning your U-Haul, Penske, Budget, or Enterprise truck and avoid the fuel surcharge.",
  step: [
    {
      "@type": "HowToStep",
      name: "Select your truck",
      text: "Choose your rental company (U-Haul, Penske, Budget, or Enterprise) and truck size. FillRight has accurate tank capacity and fuel efficiency data for every model.",
    },
    {
      "@type": "HowToStep",
      name: "Enter your fuel levels",
      text: "Set the gauge level shown on your rental contract at the time of pickup, then set your current fuel level using the gauge selector.",
    },
    {
      "@type": "HowToStep",
      name: "Add your remaining distance",
      text: "If you have miles left to drive before the drop-off, enter that distance. FillRight subtracts the fuel you'll burn so your return level stays above the required amount.",
    },
    {
      "@type": "HowToStep",
      name: "Get your answer",
      text: "FillRight instantly shows the exact gallons to add, plus an optional cost estimate if you enter the current gas price. Fill up at any regular gas station and return the truck with confidence.",
    },
  ],
};

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

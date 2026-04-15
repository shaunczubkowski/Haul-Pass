import type { Metadata } from "next";
import Link from "next/link";
import { Route } from "lucide-react";
import { RoutePlannerForm } from "./RoutePlannerForm";

// force-dynamic ensures the feature flag is read from the server environment
// at request time rather than being baked in at build time.
// NEXT_PUBLIC_ variables are inlined by the bundler during the build and cannot
// be changed after deployment without a rebuild — a plain server-side env var
// read on a dynamic page gives true runtime control.
export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.getfillright.com";
const FEATURE_ENABLED = process.env.FEATURE_ROUTE_PLANNER === "true";

const jsonLdBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "FillRight", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Route Fuel Planner", item: `${siteUrl}/route-planner` },
  ],
};

export const metadata: Metadata = {
  title: "Route Fuel Planner for Moving Trucks — FillRight",
  description:
    "Plan fuel stops for long-distance moving truck trips with U-Haul, Penske, Budget, and Enterprise. Know exactly how many gallons to add at each stop.",
  robots: FEATURE_ENABLED ? { index: true, follow: true } : { index: false, follow: true },
  alternates: { canonical: `${siteUrl}/route-planner` },
  openGraph: { url: `${siteUrl}/route-planner` },
};

export default function RoutePlannerPage() {
  return (
    <main id="main-content" className="flex flex-1 flex-col items-center bg-background px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <Route size={40} className="text-accent" aria-hidden="true" />
          </div>
          <p className="text-3xl font-bold tracking-tight text-text-primary">FillRight</p>
          <h1 className="mt-1 text-xl font-semibold text-text-primary">Route Fuel Planner</h1>
          {FEATURE_ENABLED ? (
            <>
              <p className="mt-1 text-sm text-text-secondary">
                Long-distance move? Plan your fuel stops — know exactly how many gallons to add at each one.
              </p>
              <p className="mt-3 text-xs text-text-muted">
                Need to calculate your return fill-up?{" "}
                <Link href="/" className="underline hover:text-text-secondary transition-colors">
                  Use the fuel return calculator →
                </Link>
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-text-secondary">
              Coming soon — route-based fuel stop planning for long-distance moves.
            </p>
          )}
        </div>

        {FEATURE_ENABLED ? (
          <RoutePlannerForm />
        ) : (
          <div className="rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
            <p className="text-sm text-text-muted">
              This feature is under active development.{" "}
              <Link href="/" className="underline hover:text-text-secondary transition-colors">
                Return to the calculator →
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

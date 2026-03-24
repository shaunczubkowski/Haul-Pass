import type { Metadata } from "next";
import Link from "next/link";
import { Route } from "lucide-react";
import { RoutePlannerForm } from "./RoutePlannerForm";

export const metadata: Metadata = {
  title: "Route Fuel Planner — FillRight",
  description:
    "Plan your moving truck fuel stops for long-distance trips. Enter your route and truck to get gallon-by-gallon stop recommendations every 180 miles.",
  robots: { index: true, follow: true },
};

export default function RoutePlannerPage() {
  return (
    <main id="main-content" className="flex flex-1 flex-col items-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <Route size={40} className="text-accent" aria-hidden="true" />
          </div>
          <p className="text-3xl font-bold tracking-tight text-text-primary">FillRight</p>
          <h1 className="mt-1 text-xl font-semibold text-text-primary">Route Fuel Planner</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Long-distance move? Plan your fuel stops every 180 miles — know exactly how many gallons to add at each one.
          </p>
          <p className="mt-3 text-xs text-text-muted">
            Need to calculate your return fill-up?{" "}
            <Link href="/" className="underline hover:text-text-secondary transition-colors">
              Use the fuel return calculator →
            </Link>
          </p>
        </div>

        <RoutePlannerForm />
      </div>
    </main>
  );
}

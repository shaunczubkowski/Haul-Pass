import Link from "next/link";

const FOUNDING_YEAR = 2026;

export function Footer() {
  const currentYear = new Date().getFullYear();
  const copyrightRange =
    currentYear > FOUNDING_YEAR ? `${FOUNDING_YEAR}–${currentYear}` : `${FOUNDING_YEAR}`;

  return (
    <footer className="w-full border-t border-border bg-surface-raised px-4 py-6">
      <div className="mx-auto max-w-lg flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-text-secondary">
          © {copyrightRange} FillRight. All rights reserved.
        </p>
        <nav aria-label="Site links" className="flex items-center gap-4">
          <Link
            href="/route-planner"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Route Planner
          </Link>
          <Link
            href="/truck-specs"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Truck Specs
          </Link>
          <Link
            href="/terms"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Privacy
          </Link>
        </nav>
        <p className="text-sm text-text-secondary">
          Not affiliated with U-Haul, Penske, Budget, or Enterprise.
        </p>
      </div>
    </footer>
  );
}

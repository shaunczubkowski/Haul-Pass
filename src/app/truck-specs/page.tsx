import type { Metadata } from "next";
import Link from "next/link";
import {
  UHAUL_TRUCKS,
  PENSKE_TRUCKS,
  BUDGET_TRUCKS,
  ENTERPRISE_TRUCKS,
} from "@/data/trucks";
import type { TruckType } from "@/types";

export const metadata: Metadata = {
  title: "Moving Truck Specifications: Tank Size & MPG",
  description:
    "Compare moving truck tank capacity, MPG estimates, and fuel type across U-Haul, Penske, Budget, and Enterprise — with links to official sources.",
  robots: { index: true, follow: true },
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.getfillright.com";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "Moving Truck Specifications",
  description:
    "Tank capacity, MPG estimates, and fuel type for U-Haul, Penske, Budget, and Enterprise moving trucks.",
  url: `${siteUrl}/truck-specs`,
  creator: {
    "@type": "WebApplication",
    name: "FillRight",
    url: siteUrl,
  },
  variableMeasured: ["Tank capacity (gallons)", "MPG estimate (empty truck)", "Fuel type"],
};

const COMPANY_SECTIONS: {
  label: string;
  trucks: TruckType[];
  note?: string;
}[] = [
  {
    label: "U-Haul",
    trucks: UHAUL_TRUCKS,
    note: "All U-Haul trucks use regular unleaded gasoline.",
  },
  {
    label: "Penske",
    trucks: PENSKE_TRUCKS,
    note: "12 ft and 16 ft use regular gasoline. 22 ft and 26 ft use diesel.",
  },
  {
    label: "Budget",
    trucks: BUDGET_TRUCKS,
    note: "10 ft and 16 ft use regular gasoline. 26 ft uses diesel.",
  },
  {
    label: "Enterprise",
    trucks: ENTERPRISE_TRUCKS,
    note: "All Enterprise trucks use regular unleaded gasoline.",
  },
];

function SourceBadge({ source }: { source: "official" | "official-range" | "estimated" }) {
  if (source === "official") {
    return (
      <span className="inline-block rounded px-1.5 py-0.5 text-xs font-medium bg-accent-muted text-accent">
        Official
      </span>
    );
  }
  if (source === "official-range") {
    return (
      <span className="inline-block rounded px-1.5 py-0.5 text-xs font-medium bg-accent-muted/50 text-accent">
        Official range
      </span>
    );
  }
  return (
    <span className="inline-block rounded px-1.5 py-0.5 text-xs font-medium bg-surface-raised text-text-secondary">
      Estimated
    </span>
  );
}

function CompanySection({
  label,
  trucks,
  note,
}: {
  label: string;
  trucks: TruckType[];
  note?: string;
}) {
  const sectionId = `section-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section aria-labelledby={sectionId} className="space-y-3">
      <div>
        <h2 id={sectionId} className="text-lg font-semibold text-text-primary">
          {label}
        </h2>
        {note && <p className="text-sm text-text-secondary mt-0.5">{note}</p>}
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{label} truck specifications</caption>
            <thead>
              <tr className="border-b border-border bg-surface-raised">
                <th
                  scope="col"
                  className="px-4 py-3 text-left font-medium text-text-secondary"
                >
                  Truck
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right font-medium text-text-secondary whitespace-nowrap"
                >
                  Tank (gal)
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right font-medium text-text-secondary whitespace-nowrap"
                >
                  MPG (empty)
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left font-medium text-text-secondary"
                >
                  Fuel
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left font-medium text-text-secondary whitespace-nowrap"
                >
                  Load size
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left font-medium text-text-secondary"
                >
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {trucks.map((truck) => (
                <tr key={truck.id} className="hover:bg-surface-raised transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">
                    {truck.name}
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary tabular-nums">
                    {truck.tankCapacity}
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary tabular-nums">
                    {truck.mpg}
                  </td>
                  <td className="px-4 py-3 text-text-secondary capitalize">
                    {truck.fuelType}
                  </td>
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                    {truck.loadSize ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {truck.sourceUrl && truck.mpgSource ? (
                      <a
                        href={truck.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                        aria-label={`${truck.name} specs — ${truck.mpgSource} source (opens in new tab)`}
                      >
                        <SourceBadge source={truck.mpgSource} />
                      </a>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default function TruckSpecsPage() {
  return (
    <main id="main-content" className="flex flex-1 flex-col items-center bg-background px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="w-full max-w-3xl">
        <Link
          href="/"
          aria-label="Back to FillRight"
          className="mb-8 inline-flex items-center gap-1 py-2 -my-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <span aria-hidden="true">←</span> Back to FillRight
        </Link>

        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Moving Truck Specifications
        </h1>
        <p className="text-sm text-text-secondary mb-8 leading-relaxed">
          Tank capacity, fuel economy estimates, and fuel type for every truck supported
          by FillRight — across U-Haul, Penske, Budget, and Enterprise. MPG figures are
          for empty trucks under ideal conditions; loaded real-world MPG is typically
          20–40% lower. All values used in the FillRight calculator are sourced from
          company spec pages where available, or from industry class averages when
          companies do not publish per-truck figures.
        </p>

        <div className="space-y-10">
          {COMPANY_SECTIONS.map(({ label, trucks, note }) => (
            <CompanySection key={label} label={label} trucks={trucks} note={note} />
          ))}
        </div>

        {/* Methodology note */}
        <div className="mt-10 rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary space-y-2">
          <p className="font-medium text-text-primary">About these figures</p>
          <ul className="space-y-1 list-disc list-inside leading-relaxed">
            <li>
              <strong>Official</strong> — taken directly from the rental company&apos;s
              per-truck spec page.
            </li>
            <li>
              <strong>Estimated</strong> — derived from industry guides or truck-class
              averages when the company does not publish a per-truck figure.
            </li>
            <li>
              All MPG values are for an <strong>empty truck under ideal conditions</strong>.
              Loaded real-world MPG will be lower — typically 20–40% less on a full
              household move.
            </li>
            <li>
              Specs vary by make, model year, and location. Always verify with your
              rental company before your move.
            </li>
          </ul>
        </div>

        <p className="mt-8 text-xs text-text-muted">
          Not affiliated with U-Haul, Penske, Budget, or Enterprise. Specifications
          sourced from public company pages and industry references.{" "}
          <Link
            href="/"
            className="underline underline-offset-2 hover:text-text-secondary transition-colors"
          >
            Use the FillRight calculator →
          </Link>
        </p>
      </div>
    </main>
  );
}

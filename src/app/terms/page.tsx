import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for FillRight, the moving truck fuel return calculator.",
  robots: { index: false, follow: true },
};

export default function TermsOfService() {
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <Link
          href="/"
          aria-label="Back to FillRight"
          className="mb-8 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <span aria-hidden="true">←</span> Back to FillRight
        </Link>

        <h1 className="text-2xl font-bold text-zinc-900 mb-1">Terms of Service</h1>
        <p className="text-sm text-zinc-500 mb-8">Effective date: March 11, 2026 · Last updated: March 11, 2026</p>

        <div className="space-y-8 text-zinc-700">

          <section aria-labelledby="section-no-affiliation">
            <h2 id="section-no-affiliation" className="text-lg font-semibold text-zinc-900 mb-2">1. No Affiliation</h2>
            <p className="text-sm leading-relaxed">
              FillRight is an independent tool and is <strong>not affiliated with, endorsed by, sponsored by, or
              connected to</strong> U-Haul International, Penske Truck Leasing, Budget Truck Rental, Enterprise
              Truck Rental, or any of their subsidiaries or affiliates. Use of their names is solely for
              identification purposes.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              U-Haul® is a registered trademark of U-Haul International, Inc. Penske® is a registered trademark
              of Penske Truck Leasing Co., L.P. Budget® is a registered trademark of Avis Budget Group. Enterprise®
              is a registered trademark of Enterprise Holdings, Inc. All rights reserved by their respective owners.
            </p>
          </section>

          <section aria-labelledby="section-estimates-only">
            <h2 id="section-estimates-only" className="text-lg font-semibold text-zinc-900 mb-2">2. Estimates Only — Not a Guarantee</h2>
            <p className="text-sm leading-relaxed">
              FillRight provides <strong>fuel estimates only</strong> and is intended for informational purposes.
              Results are approximations based on publicly available truck specifications and do not constitute
              professional or contractual advice. Estimates are subject to the following limitations:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-600 list-disc list-inside leading-relaxed">
              <li>Truck specifications (tank size, fuel efficiency) may change without notice.</li>
              <li>Individual vehicle condition, load weight, driving speed, and terrain all affect actual fuel consumption.</li>
              <li>Fuel gauges on moving trucks can lag or read inaccurately, especially after refueling.</li>
              <li>FillRight adds a 0.5-gallon safety buffer to help offset gauge imprecision, but this may not be sufficient in all cases.</li>
              <li>Penske&apos;s 22 ft and 26 ft trucks use <strong>diesel fuel</strong>. All other supported trucks use regular unleaded. Always confirm the correct fuel type before filling up.</li>
            </ul>
            <p className="mt-3 text-sm font-medium text-zinc-800">
              Always verify the required return fuel level with your rental contract and your rental company before returning the vehicle.
            </p>
          </section>

          <section aria-labelledby="section-no-liability">
            <h2 id="section-no-liability" className="text-lg font-semibold text-zinc-900 mb-2">3. No Liability</h2>
            <p className="text-sm leading-relaxed">
              FillRight and its operators are <strong>not responsible</strong> for any fuel return fees, service
              charges, surcharges, or costs of any kind that you incur with a rental company as a result of using
              this tool. Your rental agreement is the authoritative document governing your obligations — not
              FillRight&apos;s estimates.
            </p>
          </section>

          <section aria-labelledby="section-no-warranty">
            <h2 id="section-no-warranty" className="text-lg font-semibold text-zinc-900 mb-2">4. No Warranty</h2>
            <p className="text-sm leading-relaxed">
              This tool is provided <strong>&quot;as is&quot;</strong> without warranty of any kind, express or implied,
              including but not limited to warranties of accuracy, merchantability, or fitness for a particular
              purpose. We do not warrant that the tool will be error-free, uninterrupted, or produce results
              suitable for your specific situation.
            </p>
          </section>

          <section aria-labelledby="section-limitation-of-liability">
            <h2 id="section-limitation-of-liability" className="text-lg font-semibold text-zinc-900 mb-2">5. Limitation of Liability</h2>
            <p className="text-sm leading-relaxed">
              To the maximum extent permitted by applicable law, FillRight and its operators shall not be liable
              for any direct, indirect, incidental, special, or consequential damages arising from your use of —
              or inability to use — this tool, even if advised of the possibility of such damages. In no event
              shall FillRight&apos;s total liability to you exceed zero dollars ($0), as this service is provided
              free of charge.
            </p>
          </section>

          <section aria-labelledby="section-ip">
            <h2 id="section-ip" className="text-lg font-semibold text-zinc-900 mb-2">6. Intellectual Property</h2>
            <p className="text-sm leading-relaxed">
              The FillRight application, including its source code, design, and written content, is copyright
              © 2025–present FillRight. All rights reserved. The truck specifications used in this app are sourced
              from publicly available rental company websites for informational purposes.
            </p>
          </section>

          <section aria-labelledby="section-changes">
            <h2 id="section-changes" className="text-lg font-semibold text-zinc-900 mb-2">7. Changes to These Terms</h2>
            <p className="text-sm leading-relaxed">
              These terms may be updated from time to time. We will update the &quot;Last Updated&quot; date at the top
              of this page when changes are made. For material changes, we will also note the update on the
              FillRight homepage where practicable. Continued use of FillRight after any changes constitutes
              acceptance of the updated terms.
            </p>
          </section>

          <section aria-labelledby="section-governing-law">
            <h2 id="section-governing-law" className="text-lg font-semibold text-zinc-900 mb-2">8. Governing Law</h2>
            <p className="text-sm leading-relaxed">
              These terms are governed by the laws of the State of Wisconsin, without regard to conflict of law
              principles.
            </p>
          </section>

          <section aria-labelledby="section-contact">
            <h2 id="section-contact" className="text-lg font-semibold text-zinc-900 mb-2">9. Contact</h2>
            <p className="text-sm leading-relaxed">
              For legal inquiries, please contact:{" "}
              <a href="mailto:getfillright@gmail.com" className="text-zinc-700 underline underline-offset-2 hover:text-orange-600 transition-colors">getfillright@gmail.com</a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-zinc-200">
          <Link
            href="/privacy"
            className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            Privacy Policy <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for FillRight, the moving truck fuel return calculator.",
  robots: { index: false, follow: true },
};

export default function PrivacyPolicy() {
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

        <h1 className="text-2xl font-bold text-zinc-900 mb-1">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mb-8">Effective date: March 11, 2026 · Last updated: March 11, 2026</p>

        <div className="space-y-8 text-zinc-700">

          <section aria-labelledby="section-short-version">
            <h2 id="section-short-version" className="text-lg font-semibold text-zinc-900 mb-2">The short version</h2>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <ul className="text-sm space-y-1">
                <li><span aria-hidden="true">✓</span> No analytics or tracking</li>
                <li><span aria-hidden="true">✓</span> No cookies, ever</li>
                <li><span aria-hidden="true">✓</span> No user accounts or login</li>
                <li><span aria-hidden="true">✓</span> No data sold or shared</li>
                <li><span aria-hidden="true">✓</span> All calculations run in your browser</li>
              </ul>
            </div>
          </section>

          <section aria-labelledby="section-what-we-collect">
            <h2 id="section-what-we-collect" className="text-lg font-semibold text-zinc-900 mb-2">1. What We Collect</h2>
            <p className="text-sm leading-relaxed">
              FillRight does <strong>not collect personal information</strong>. The calculator inputs you enter
              (truck type, fuel levels, distance, gas price) are used only to perform the calculation in your
              browser. They are never transmitted to or stored on any server.
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              If you use the &quot;Share this calculation&quot; feature, your inputs are encoded in the URL as query
              parameters (e.g., <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">?truck=uhaul-15&amp;pickup=1&amp;current=0.5</code>).
              This URL exists only in your browser — nothing is stored on our servers.
            </p>
          </section>

          <section aria-labelledby="section-what-we-dont-collect">
            <h2 id="section-what-we-dont-collect" className="text-lg font-semibold text-zinc-900 mb-2">2. What We Don&apos;t Collect</h2>
            <ul className="text-sm text-zinc-600 list-disc list-inside space-y-1 leading-relaxed">
              <li>No analytics (no Google Analytics, Mixpanel, or similar)</li>
              <li>No advertising or tracking pixels</li>
              <li>No cookies or browser storage (no localStorage, no sessionStorage)</li>
              <li>No device fingerprinting</li>
              <li>No email addresses or contact information</li>
              <li>No payment information</li>
            </ul>
          </section>

          <section aria-labelledby="section-hosting">
            <h2 id="section-hosting" className="text-lg font-semibold text-zinc-900 mb-2">3. Hosting — Vercel</h2>
            <p className="text-sm leading-relaxed">
              FillRight is hosted on{" "}
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-900 underline underline-offset-2 hover:text-orange-600 transition-colors"
              >
                Vercel<span className="sr-only"> (opens in new tab)</span>
              </a>
              . As part of normal hosting operations, Vercel may collect standard server access logs, which can
              include your IP address, browser user agent, and request timestamps. This data is handled according
              to{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-900 underline underline-offset-2 hover:text-orange-600 transition-colors"
              >
                Vercel&apos;s Privacy Policy<span className="sr-only"> (opens in new tab)</span>
              </a>
              . We do not have access to individual-level log data.
            </p>
          </section>

          <section aria-labelledby="section-fonts">
            <h2 id="section-fonts" className="text-lg font-semibold text-zinc-900 mb-2">4. Fonts</h2>
            <p className="text-sm leading-relaxed">
              FillRight uses the Geist typeface. The font files are self-hosted and served directly from
              FillRight&apos;s own servers — <strong>no request is ever made to Google&apos;s servers or any
              third-party font CDN</strong> from your browser. This is the only external data concern we
              audited, and it does not apply.
            </p>
          </section>

          <section aria-labelledby="section-data-sharing">
            <h2 id="section-data-sharing" className="text-lg font-semibold text-zinc-900 mb-2">5. Data Sharing</h2>
            <p className="text-sm leading-relaxed">
              We do not sell, rent, trade, or otherwise share any data with third parties. We do not sell
              personal information as defined under the California Consumer Privacy Act (CCPA) or any
              applicable state privacy law.
            </p>
          </section>

          <section aria-labelledby="section-children">
            <h2 id="section-children" className="text-lg font-semibold text-zinc-900 mb-2">6. Children</h2>
            <p className="text-sm leading-relaxed">
              FillRight is not directed at children under the age of 13 and does not knowingly collect
              information from children.
            </p>
          </section>

          <section aria-labelledby="section-policy-changes">
            <h2 id="section-policy-changes" className="text-lg font-semibold text-zinc-900 mb-2">7. Changes to This Policy</h2>
            <p className="text-sm leading-relaxed">
              If this policy changes materially, we will update the &quot;Last Updated&quot; date at the top of this
              page and note the update on the FillRight homepage where practicable. Continued use of FillRight
              after any changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section aria-labelledby="section-privacy-contact">
            <h2 id="section-privacy-contact" className="text-lg font-semibold text-zinc-900 mb-2">8. Contact</h2>
            <p className="text-sm leading-relaxed">
              For privacy questions, please contact:{" "}
              <a href="mailto:getfillright@gmail.com" className="text-zinc-700 underline underline-offset-2 hover:text-orange-600 transition-colors">getfillright@gmail.com</a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-zinc-200">
          <Link
            href="/terms"
            className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            Terms of Service <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

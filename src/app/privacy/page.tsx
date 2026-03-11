import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for FillRight, the moving truck fuel return calculator.",
  robots: { index: false, follow: false },
};

export default function PrivacyPolicy() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          ← Back to FillRight
        </Link>

        <h1 className="text-2xl font-bold text-zinc-900 mb-1">Privacy Policy</h1>
        <p className="text-sm text-zinc-400 mb-8">Effective date: March 11, 2025 · Last updated: March 11, 2026</p>

        <div className="space-y-8 text-zinc-700">

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-2">The short version</h2>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm space-y-1">
              <p>✓ No analytics or tracking</p>
              <p>✓ No cookies, ever</p>
              <p>✓ No user accounts or login</p>
              <p>✓ No data sold or shared</p>
              <p>✓ All calculations run in your browser</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-2">1. What We Collect</h2>
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

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-2">2. What We Don&apos;t Collect</h2>
            <ul className="text-sm text-zinc-600 list-disc list-inside space-y-1 leading-relaxed">
              <li>No analytics (no Google Analytics, Mixpanel, or similar)</li>
              <li>No advertising or tracking pixels</li>
              <li>No cookies or browser storage (no localStorage, no sessionStorage)</li>
              <li>No device fingerprinting</li>
              <li>No email addresses or contact information</li>
              <li>No payment information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-2">3. Hosting — Vercel</h2>
            <p className="text-sm leading-relaxed">
              FillRight is hosted on{" "}
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-900 underline underline-offset-2 hover:text-orange-600 transition-colors"
              >
                Vercel
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
                Vercel&apos;s Privacy Policy
              </a>
              . We do not have access to individual-level log data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-2">4. Fonts — Google Fonts</h2>
            <p className="text-sm leading-relaxed">
              FillRight loads the Geist typeface via{" "}
              <a
                href="https://fonts.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-900 underline underline-offset-2 hover:text-orange-600 transition-colors"
              >
                Google Fonts
              </a>
              . When your browser loads the font, a request is made to Google&apos;s CDN. This is the only
              external network request FillRight makes. Google may log this request per their{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-900 underline underline-offset-2 hover:text-orange-600 transition-colors"
              >
                Privacy Policy
              </a>
              . On repeat visits, the font is loaded from your browser&apos;s local cache without contacting Google.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-2">5. Data Sharing</h2>
            <p className="text-sm leading-relaxed">
              We do not sell, rent, trade, or otherwise share any data with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-2">6. Children</h2>
            <p className="text-sm leading-relaxed">
              FillRight is not directed at children under the age of 13 and does not knowingly collect
              information from children.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-2">7. Changes to This Policy</h2>
            <p className="text-sm leading-relaxed">
              If this policy changes materially, we will update the &quot;Last updated&quot; date at the top of this page.
              Continued use of FillRight after any changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-2">8. Contact</h2>
            <p className="text-sm leading-relaxed">
              For privacy questions, please contact:{" "}
              <span className="text-zinc-400">[contact@example.com — update before publishing]</span>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-zinc-200">
          <Link
            href="/terms"
            className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            Terms of Service →
          </Link>
        </div>
      </div>
    </main>
  );
}

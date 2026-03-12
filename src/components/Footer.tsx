import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 bg-zinc-50 px-4 py-6">
      <div className="mx-auto max-w-lg flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-zinc-600">
          © 2025–present FillRight. All rights reserved.
        </p>
        <nav aria-label="Legal" className="flex items-center gap-4">
          <Link
            href="/terms"
            className="text-sm text-zinc-600 hover:text-zinc-800 transition-colors underline underline-offset-2"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-zinc-600 hover:text-zinc-800 transition-colors underline underline-offset-2"
          >
            Privacy Policy
          </Link>
        </nav>
        <p className="text-sm text-zinc-600">
          Not affiliated with U-Haul, Penske, Budget, or Enterprise.
        </p>
      </div>
    </footer>
  );
}

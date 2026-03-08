import type { Metadata } from "next";
import { ReloadButton } from "./ReloadButton";

export const metadata: Metadata = {
  title: "Offline — FillRight",
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <span className="text-4xl mb-4" aria-hidden="true">
        ⛽
      </span>
      <h1 className="text-2xl font-bold mb-2">FillRight</h1>
      <p className="text-lg font-semibold mb-4">You&apos;re offline</p>
      <p className="text-gray-600 mb-6 max-w-sm">
        No internet connection. The calculator will be available once you
        reconnect.
      </p>
      <ReloadButton />
    </main>
  );
}

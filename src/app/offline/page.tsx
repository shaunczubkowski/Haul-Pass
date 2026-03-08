export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">You&apos;re offline</h1>
      <p className="text-gray-600 mb-6">
        No internet connection. The calculator is available once you reconnect.
      </p>
      <a href="/" className="text-orange-500 underline">Try again</a>
    </main>
  );
}

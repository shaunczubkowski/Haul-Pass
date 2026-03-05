export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 text-5xl">⛽</div>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-zinc-900">
          FillRight
        </h1>
        <p className="mb-8 text-lg text-zinc-600">
          U-Haul Fuel Return Calculator
        </p>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-left shadow-sm">
          <p className="text-sm text-zinc-500">
            🚧 Calculator coming soon — follow progress on{" "}
            <a
              href="https://github.com/shaunczubkowski/Haul-Pass"
              className="font-medium text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            .
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            This tool will tell you exactly how many gallons to add before
            returning your U-Haul or moving truck — no more guessing at the
            pump.
          </p>
        </div>
      </div>
    </main>
  );
}

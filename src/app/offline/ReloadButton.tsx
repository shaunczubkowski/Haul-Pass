"use client";

export function ReloadButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="text-orange-700 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700 rounded"
    >
      Try again
    </button>
  );
}

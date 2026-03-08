"use client";

export function ReloadButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="text-orange-600 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 rounded"
    >
      Try again
    </button>
  );
}

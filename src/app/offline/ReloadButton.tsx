"use client";

export function ReloadButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="text-accent underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded"
    >
      Try again
    </button>
  );
}

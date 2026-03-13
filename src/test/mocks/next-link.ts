import React from "react";

// Minimal next/link mock for jsdom tests. Intentionally omitted props:
//   target, rel, prefetch, replace, scroll
// None of these are forwarded to the rendered <a> element. Do not write
// assertions against target/rel on <Link> elements — test bare <a> tags instead.
export default function Link({
  href,
  children,
  className,
  "aria-label": ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return React.createElement("a", { href, className, "aria-label": ariaLabel }, children);
}

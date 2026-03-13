import React from "react";

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

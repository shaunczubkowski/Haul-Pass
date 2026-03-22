import React from "react";

// Minimal mock for next/link in Vitest — renders a plain <a> tag.
const Link = ({
  href,
  children,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  [key: string]: unknown;
}) => (
  <a href={String(href)} {...props}>
    {children}
  </a>
);

export default Link;

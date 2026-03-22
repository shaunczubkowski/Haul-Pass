import React from "react";

// Minimal mock for next/link — renders a plain <a> so unit tests
// can assert on href, target, rel, and accessible name without
// needing the full Next.js router.
const Link = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
>(function Link({ href, children, ...rest }, ref) {
  return (
    <a ref={ref} href={href} {...rest}>
      {children}
    </a>
  );
});

Link.displayName = "Link";

export default Link;

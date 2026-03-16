"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-11 h-11" aria-hidden="true" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="flex items-center justify-center w-11 h-11 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-overlay transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
